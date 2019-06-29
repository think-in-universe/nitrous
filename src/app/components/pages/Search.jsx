import React from 'react';
import tt from 'counterpart';
import { APP_NAME } from 'app/client_config';

class Search extends React.Component {
    render() {
        return (
            <div className="Search">
                <div className="row medium-8 large-7 search-content">
                    <div className="columns">
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

    addPreviews() {
        // const $ = document.querySelectorAll;
        const search_res_titles =
            'div.gsc-wrapper div.gsc-thumbnail-inside a.gs-title';

        // steem.api.setOptions({ url: 'https://steemd.minnowsupportproject.org' });

        function render_preview(element) {
            // render the preview with steem.js
            if (element && element.href) {
                var segs = element.href.split('/');
                var permlink = segs[segs.length - 1];
                var author = segs[segs.length - 2].replace('@', '');
                steem.api.getContent(author, permlink, function(err, result) {
                    if (result && result.body) {
                        append_preview_element(element, result.body);
                    }
                });
            }
        }

        function get_preview_element(e) {
            var res = $(e)
                .parent()
                .parent()
                .parent();
            return res.children('div.box');
        }

        function add_mouseover_listener(e) {
            var events = $._data(e, 'events');
            if (!events || !events.mouseover || events.mouseover.length == 0) {
                $(e)
                    .on('mouseover', function() {
                        render_preview(this);
                        get_preview_element(e).show();
                    })
                    .on('mouseout', function() {
                        get_preview_element(e).hide();
                    });
            }
        }

        function clean_markdown(md) {
            // remove image tag
            return md.replace(/(?:!\[(.*?)\]\((.*?)\))/g, '');
        }

        function append_preview_element(e, md) {
            var res = $(e)
                .parent()
                .parent()
                .parent();
            if (res.children('div.box').length == 0) {
                md = clean_markdown(md);
                res.append('<div class="box">' + marked(md) + '</div>');
            }
        }

        function attach_preview_listeners() {
            // 1. find the search results elements
            var elements = $(search_res_titles);

            // 2. add the preview function on mouseover event
            if (elements && elements.length > 0) {
                for (var i = 0; i < elements.length; i++) {
                    var e = elements[i];
                    add_mouseover_listener(e);
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

module.exports = {
    path: 'search.html',
    component: Search,
};
