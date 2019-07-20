import React from 'react';
import tt from 'counterpart';
import { connect } from 'react-redux';
// import ReactDOM from 'react-dom';
import * as globalActions from 'app/redux/GlobalReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import { GOOGLE_CUSTOM_SEARCH_ID } from 'app/client_config';
// import MarkdownViewer from 'app/components/cards/MarkdownViewer';
import { isLoggedIn } from 'app/utils/UserUtil';
import { api } from '@steemit/steem-js';
import ReactHintFactory from 'react-hint';
const ReactHint = ReactHintFactory(React);

class PaidSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: false,
            preview: null,
        };
        this.errorCallback = this.errorCallback.bind(this);
        this.addPreviews = this.addPreviews.bind(this);
        this.onRenderPreview = this.onRenderPreview.bind(this);
    }

    render() {
        const { loading } = this.state;
        // className="preview"

        if (isLoggedIn()) {
            return (
                <div className="Search">
                    <div className="row medium-8 large-7 search-content">
                        <ReactHint
                            autoPosition
                            events
                            delay={{ show: 100, hide: 500 }}
                        />
                        <ReactHint
                            persist
                            attribute="data-search"
                            events={{ hover: true }}
                            onRenderContent={this.onRenderPreview}
                            ref={ref => (this.instance = ref)}
                        />
                        <div className="columns">
                            {loading && (
                                <span>
                                    <LoadingIndicator type="circle" />
                                    <br />
                                </span>
                            )}
                            {/* <gcse:search linktarget="_self"></gcse:search> */}
                            <div
                                id="search_renderer"
                                className="gcse-searchbox"
                                data-newWindow="true"
                            />
                        </div>
                    </div>
                </div>
            );
        } else {
            return <div />;
        }
    }

    insertCSE() {
        // (function() {
        const cx = GOOGLE_CUSTOM_SEARCH_ID;
        let gcse = document.createElement('script');
        gcse.type = 'text/javascript';
        gcse.async = true;
        gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
        let s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(gcse, s);
        // })();
    }

    renderCSE() {
        const renderer = () => {
            // Render an element with both search box and search results in div with id 'search_renderer'.
            google.search.cse.element.render({
                div: 'search_renderer',
                tag: 'search',
                gname: 'custom_search',
            });
        };
        const myCallback = () => {
            if (document.readyState == 'complete') {
                // Document is ready when CSE element is initialized.
                renderer();
            } else {
                // Document is not ready yet, when CSE element is initialized.
                google.setOnLoadCallback(function() {
                    renderer();
                }, true);
            }
        };
        // Insert it before the CSE code snippet so that cse.js can take the script
        // parameters, like parsetags, callbacks.
        window.__gcse = {
            parsetags: 'explicit', // 'onload', //
            callback: myCallback,
        };
    }

    loadScripts(callback) {
        function loadScript(url, callback) {
            let script = document.createElement('script');
            script.type = 'text/javascript';

            if (script.readyState) {
                //IE
                script.onreadystatechange = function() {
                    if (
                        script.readyState == 'loaded' ||
                        script.readyState == 'complete'
                    ) {
                        script.onreadystatechange = null;
                        if (callback) callback();
                    }
                };
            } else {
                //Others
                script.onload = function() {
                    if (callback) callback();
                };
            }

            script.src = url;
            document.getElementsByTagName('head')[0].appendChild(script);
        }

        loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.slim.min.js',
            callback
        );
        loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
    }

    parsePost(element, attribute) {
        const reserved_pages = [
            'feed',
            'transfers',
            'followed',
            'followers',
            'comments',
            'recent-replies',
            'settings',
        ];
        if (element && element.getAttribute(attribute)) {
            let segs = element.getAttribute(attribute).split('/');
            let permlink = segs[segs.length - 1];
            let author = segs[segs.length - 2];

            if (
                author.indexOf('@') != -1 &&
                reserved_pages.indexOf(permlink) == -1
            ) {
                author = author.replace('@', '');
                return {
                    author,
                    permlink,
                };
            }
            return null;
        }
        return null;
    }

    showRewardPost(element) {
        const res = this.parsePost(element, 'gs-url');
        if (res) {
            const { author, permlink } = res;

            const openPage = () => {
                // save the selected status in local storage
                localStorage.setItem(`selected-@${author}/${permlink}`, 'true');
                this.setState({ loading: false });
                $(element).attr('href', $(element).attr('gs-url'));
                element.click();
            };

            this.props.showRewardPost(author, permlink, openPage);
        }
    }

    errorCallback(estr) {
        this.setState({ loading: false });
    }

    renderMarkdown(md) {
        // remove image tag
        // md = md.replace(/(?:!\[(.*?)\]\((.*?)\))/g, '');
        let h = marked(md);
        h = $('<p>')
            .html(h)
            .find('img')
            .remove()
            .end()
            .html();
        return h;

        // res.append('<div class="box" />');
        // ReactDOM.render(
        //     <MarkdownViewer
        //         formId={"search-preview" + '-viewer'}
        //         text={md}
        //         jsonMetadata={{}}
        //         large
        //         highQualityPost={false}
        //         noImage={true}
        //         hideImages={true}
        //     />,
        //     res.children('div.box')[0]
        // );
    }

    onRenderPreview(target, content) {
        console.log('render preview', target, content);

        // render the preview with steem API
        const res = this.parsePost(target, 'gs-url');
        if (res) {
            const { author, permlink } = res;
            console.log('post', author, permlink);
            api.getContent(author, permlink, (err, result) => {
                if (result && result.body) {
                    this.setState({
                        preview: this.renderMarkdown(result.body),
                    });
                }
            });
        }

        return (
            <div
                className="preview"
                dangerouslySetInnerHTML={{ __html: this.state.preview }}
            />
        );
    }

    addPreviews() {
        const page = this;
        const search_res_titles = 'div.gs-webResult.gs-result a[data-cturl]';

        // steem.api.setOptions({ url: 'https://steemd.minnowsupportproject.org' });

        function add_event_listeners(e) {
            if (!e.hasAttribute('data-search')) {
                const res = page.parsePost(e, 'href');
                if (res) {
                    // update attribute
                    $(e)
                        .attr('gs-url', $(e).attr('href'))
                        .removeAttr('href');

                    $(e).attr('data-search', '');

                    $(e)
                        .on('click', function(event) {
                            // event.preventDefault();
                            let href = $(e).attr('href');
                            if (
                                typeof href === typeof undefined ||
                                href === false
                            ) {
                                page.showRewardPost(e);
                            }
                            // else {
                            //     let win = window.open();
                            //     win.location = href;
                            //     win.opener = null;
                            //     win.blur();
                            //     window.focus();
                            //     // window.open(href, '_blank');
                            // }
                        })
                        .on('mousedown', function(event) {
                            event.preventDefault();
                            event.stopPropagation();
                        });
                }
            }
        }

        function modify_search_result_listeners() {
            var elements = $(search_res_titles);
            if (elements && elements.length > 0) {
                for (var i = 0; i < elements.length; i++) {
                    var e = elements[i];
                    add_event_listeners(e);
                }
            }
        }

        function add_dom_render_observer(selector, func) {
            var i = setInterval(function() {
                if ($(selector).length != 0) {
                    func();
                    // clearInterval(i);
                }
            }, 100);
        }

        function add_previews() {
            add_dom_render_observer(
                search_res_titles,
                modify_search_result_listeners
            );
        }

        add_previews();
    }

    componentDidMount() {
        this.insertCSE();
        this.renderCSE();
        this.loadScripts(this.addPreviews);
        // this.addPreviews();
    }
}

const Search = connect(
    (state, ownProps) => {
        const currentUser = state.user.get('current'); // state.user.getIn(['current']);
        return { ...ownProps, currentUser };
    },

    // mapDispatchToProps
    dispatch => ({
        showRewardPost: (author, permlink, onSuccess) => {
            dispatch(
                globalActions.showDialog({
                    name: 'rewardPost',
                    params: { author, permlink, onSuccess },
                })
            );
        },
    })
)(PaidSearch);

module.exports = {
    path: 'search.html',
    component: Search,
};
