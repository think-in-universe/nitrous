import React from 'react';
import tt from 'counterpart';
import { connect } from 'react-redux';
// import ReactDOM from 'react-dom';
import * as transactionActions from 'app/redux/TransactionReducer';
import * as globalActions from 'app/redux/GlobalReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import {
    APP_NAME,
    LIQUID_TOKEN_UPPERCASE,
    PROMOTED_POST_ACCOUNT,
} from 'app/client_config';
// import MarkdownViewer from 'app/components/cards/MarkdownViewer';

class PaidSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amount: '1.0',
            asset: '',
            loading: false,
            amountError: '',
            trxError: '',
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.errorCallback = this.errorCallback.bind(this);
        this.addPreviews = this.addPreviews.bind(this);
        // this.amountChange = this.amountChange.bind(this);
        // this.assetChange = this.assetChange.bind(this);
    }

    render() {
        const { loading } = this.state;
        return (
            <div className="Search">
                <div className="row medium-8 large-7 search-content">
                    <div className="columns">
                        {loading && (
                            <span>
                                <LoadingIndicator type="circle" />
                                <br />
                            </span>
                        )}
                        <br />
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
    }

    insertCSE() {
        // (function() {
        const cx = '002054531452547600153:c65zk0qbyd4';
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
        loadScript('//cdn.steemjs.com/lib/latest/steem.min.js');
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

    onSubmit(element) {
        const res = this.parsePost(element, 'gs-url');
        if (res) {
            const { author, permlink } = res;
            const amount = '0.001'; // this.state;
            this.setState({ loading: true });
            // let success = false;

            const openPage = () => {
                $(element).attr('href', $(element).attr('gs-url'));
                element.click();
            };

            const onSuccess = () => {
                this.setState({ loading: false });
                // success = true;
                openPage();
            };

            // const waitForSuccess = setInterval(() => {
            //     if (success) {
            //         openPage();
            //         clearInterval(waitForSuccess);
            //     }
            // }, 200);

            console.log('-- PaidSearch.onSubmit -->');
            this.props.dispatchSubmit({
                amount,
                asset: LIQUID_TOKEN_UPPERCASE,
                author,
                permlink,
                currentUser: this.props.currentUser,
                onSuccess,
                errorCallback: this.errorCallback,
            });
        }
    }

    errorCallback(estr) {
        this.setState({ trxError: estr, loading: false });
    }

    addPreviews() {
        const page = this;
        const search_res_titles =
            'div.gsc-wrapper div.gsc-thumbnail-inside a.gs-title';

        // steem.api.setOptions({ url: 'https://steemd.minnowsupportproject.org' });

        function render_preview(element) {
            // render the preview with steem.js
            const res = page.parsePost(element, 'gs-url');
            if (res) {
                const { author, permlink } = res;
                steem.api.getContent(author, permlink, function(err, result) {
                    if (result && result.body) {
                        append_preview_element(element, result.body);
                    }
                });
            }
        }

        function clean_markdown(md) {
            // remove image tag
            md = md.replace(/(?:!\[(.*?)\]\((.*?)\))/g, '');
            return marked(md);
        }

        function get_preview_element(e) {
            var res = $(e)
                .parent()
                .parent()
                .parent();
            return res.children('div.preview');
        }

        function add_event_listeners(e) {
            var events = $._data(e, 'events');
            if (!events || !events.mouseover || events.mouseover.length == 0) {
                const res = page.parsePost(e, 'href');
                if (res) {
                    // update attribute
                    $(e)
                        .attr('gs-url', $(e).attr('href'))
                        .removeAttr('href');

                    $(e)
                        .on('mouseover', function() {
                            render_preview(this);
                            get_preview_element(e).show();
                        })
                        .on('mouseout', function() {
                            get_preview_element(e).hide();
                        })
                        .on('click', function(event) {
                            // event.preventDefault();
                            let href = $(e).attr('href');
                            if (
                                typeof href === typeof undefined ||
                                href === false
                            ) {
                                page.onSubmit(e);
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

        function append_preview_element(e, md) {
            var res = $(e)
                .parent()
                .parent()
                .parent();
            if (res.children('div.preview').length == 0) {
                res.append(
                    '<div class="preview">' + clean_markdown(md) + '</div>'
                );

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
        }

        function attach_preview_listeners() {
            // 1. find the search results elements
            var elements = $(search_res_titles);

            // 2. add the preview and pay function
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
                attach_preview_listeners
            );
        }

        // $(document).ready(function(){
        add_previews();
        // });
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
        dispatchSubmit: ({
            amount,
            asset,
            author,
            permlink,
            currentUser,
            onSuccess,
            errorCallback,
        }) => {
            if (!currentUser) {
                return;
            }

            const username = currentUser.get('username');

            const successCallback = () => {
                dispatch(
                    globalActions.getState({ url: `@${username}/transfers` })
                ); // refresh transfer history
                onSuccess();
            };
            const transferOperation = {
                contractName: 'tokens',
                contractAction: 'transfer',
                contractPayload: {
                    symbol: LIQUID_TOKEN_UPPERCASE,
                    to: author,
                    quantity: amount,
                    memo: `search and click: @${author}/${permlink}`,
                },
            };
            const operation = {
                id: 'ssc-mainnet1',
                required_auths: [username],
                json: JSON.stringify(transferOperation),
                __config: {
                    successMessage:
                        tt('search_jsx.successfully_rewarded_the_author') + '.',
                },
            };
            dispatch(
                transactionActions.broadcastOperation({
                    type: 'custom_json',
                    operation,
                    successCallback,
                    errorCallback,
                })
            );
        },
    })
)(PaidSearch);

module.exports = {
    path: 'search.html',
    component: Search,
};
