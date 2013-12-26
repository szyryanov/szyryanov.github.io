
// put everything into a local scope:
(function ($, undefined) {


    // -------------------------------------------
    //                  Main flow
    // -------------------------------------------
    //
    // calculate the widget files URLs:
    //
    var url_js = calcThisScriptSrc();
    var url_css = url_js.replace(".js", ".css");
    var url_html = url_js.replace(".js", ".html");
    //
    // add widget css:
    //
    addStyleSheet(url_css);
    //
    // Now we will start to load the widget HTML code, and wait for both the HTML and page DOM ready state
    //
    var dom_ready = $.Deferred(); // to wait when the page DOM is ready
    var html_ready = $.Deferred(); // to wait when the widget HTML is loaded
    //
    // setup the DOM waiting:
    $(document).ready(function () { dom_ready.resolve(); });
    //
    // start to load the widget HTML text:
    loadText(url_html).done(function (html) { html_ready.resolve(html); });
    //
    // start the waiting
    // when both async operations are completed, do further processing (call the replaceSelectTagsToWidgets() function):
    $.when(dom_ready, html_ready).done(function (dom_result, html_result) {
        replaceSelectTagsToWidgets($.trim(html_result));
    });
    //
    // all done!


    //#region Process <select> tags

    // -------------------------------------------
    //          Process <select> tags
    // -------------------------------------------

    // process all the <select> tags:
    function replaceSelectTagsToWidgets(html) {
        $("select").each(function () {
            var $original_select = $(this);
            //
            if ($original_select.hasClass("myselect-skip")) return; // skip the explicitly omitted tags
            if ($original_select.prop("multiple")) return; // skip the listboxes
            //
            processSelectTag($(this), html); // process the tag
        });
    }

    // process the current <select> tag:
    function processSelectTag($original_select, html) {
        // hide the <select> tag:
        if (!$original_select.hasClass("myselect-debug")) {
            $original_select.css("position", "fixed");
            $original_select.css("left", "-1000px");
            $original_select.attr("tabindex", "-1"); // remove the tag from the TAB sequence
        }
        //
        var widget = createWidget(html, $original_select); // create the widget
        //
        $original_select.after(widget.dom); // insert the widget after the <select> tag
        //
        widget.adjust();
    }

    //#endregion

    //#region Create Widget

    // -------------------------------------------
    //                  Create Widget
    // -------------------------------------------

    function createWidget(html, $original_select) {
        //
        // setup the part_ variables:
        //
        var html_dom = $.parseHTML(html);
        var $part_main = $(".part_main", html_dom).first();
        var $part_text = $(".part_text", html_dom).first();
        var $part_popup = $(".part_popup", html_dom).first();
        //
        // fill the popup list:
        //
        $("> option", $original_select).each(function (index, element) {
            $part_popup.append('<li data-index="' + index + '">' + $(element).text() + '</li>');
        });
        var $popup_items = $("> li", $part_popup);
        //
        // setup the initial selected index:
        //
        setIndex(getOriginalSelectedIndex());

        //
        // to adjust the widget when inserted into the page DOM:
        //

        function adjust() {
            // adjust the width:
            adjust_main_width();
            // close the popup
            $part_popup.slideUp(0);
        }

        $(window).on("load", function () {
            adjust_main_width();
        });

        function adjust_main_width() {
            var main_width = $part_main.width();
            var main_innerWidth = $part_main.innerWidth();
            var main_outerWidth = $part_main.outerWidth();
            //
            if ((main_width === main_innerWidth) && (main_width === main_outerWidth)) {
                return; // Chrome, Firefox, Safary: adjust() call when the DOM is not good yet
            }
            //
            var popup_outerWidth = $part_popup.outerWidth();
            var main_delta = main_outerWidth - main_width;
            //
            if ((main_width + main_delta) < popup_outerWidth) {
                $part_main.width(popup_outerWidth - main_delta);
            }
        }

        //
        // setup the UI event handlers:
        //

        $original_select.change(function () {
            setIndex(getOriginalSelectedIndex());
        });

        $part_main.click(function () {
            $part_main.focus();
            toggle();
        });

        $part_main.blur(function () {
            close();
        });

        $part_main.keydown(function (event) {
            var Key = { Space: 32, Esc: 27, Enter: 13, Left: 37, Up: 38, Right: 39, Down: 40, PgUp: 33, PgDn: 34, Home: 36, End: 35 };
            //
            switch (event.which) {
                case Key.Space: open(); break;
                case Key.Esc: close(); break;
                case Key.Enter: close(); break;
                case Key.Home: goFirst(); break;
                case Key.PgUp: goFirst(); break;
                case Key.End: goLast(); break;
                case Key.PgDn: goLast(); break;
                case Key.Left: goPrev(); break;
                case Key.Right: goNext(); break;
                case Key.Up: if (event.altKey) { open(); } else { goPrev(); } break;
                case Key.Down: if (event.altKey) { open(); } else { goNext(); } break;
            }
        });

        $part_popup.on("click", "li", function () {
            var index = Number($(this).attr("data-index"));
            setIndex(index);
            $part_main.focus();
        });

        //
        //  utility functions:
        //

        function getOriginalSelectedIndex() {
            return $original_select.prop("selectedIndex");
        }

        function setOriginalSelectedIndex(value) {
            $original_select.prop("selectedIndex", value);
        }

        function setIndex(index) {
            setOriginalSelectedIndex(index);
            //
            $popup_items.removeClass("selected");
            if (index >= 0) {
                var $item = $popup_items.eq(index);
                $item.addClass("selected");
                $part_text.text($item.text());
            }
        };

        function goPrev() {
            var index = getOriginalSelectedIndex();
            if (index > 0) setIndex(index - 1);
        }

        function goNext() {
            var index = getOriginalSelectedIndex();
            if (index < $popup_items.length - 1) setIndex(index + 1);
        }

        function goFirst() {
            setIndex(0);
        }

        function goLast() {
            setIndex($popup_items.length - 1);
        }

        function open() {
            $part_main.addClass("open");
            $part_popup.slideDown("slow");
        }

        function close() {
            $part_popup.slideUp("slow", function () { $part_main.removeClass("open"); });
        }

        function toggle() {
            if ($part_main.hasClass("open")) {
                close();
            } else {
                open();
            }
        }

        //
        // return the widget object:
        //

        return { dom: html_dom, adjust: adjust };
    }

    //#endregion

    //#region Utils

    // -------------------------------------------
    //                  Utils
    // -------------------------------------------

    // returns src property of the <script> tag currently processing by browser (i.e. this script file URL)
    // must be callid directly in the script, will not works inside "$(document).ready()"
    function calcThisScriptSrc() {
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1].src;
    }

    // add the url_css file to the page
    function addStyleSheet(url_css) {
        $("head").append('<link rel="stylesheet" href="' + url_css + '" />');
    }

    // starts to load text file by url, returns ajax object
    function loadText(url) {
        return $.ajax({ url: url, dataType: "text", cache: false });
    }

    //#endregion

})(jQuery); // end of local scope

