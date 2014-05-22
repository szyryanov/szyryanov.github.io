
// put everything into a local scope:
(function ($, undefined) {
    "use strict";

    
    // calculate the URLs:
    //
    var url_js = calcThisScriptSrc();
    var url_css = url_js.replace(".js", ".css"); //.replace(".min.css", ".css");
    //
    // add css:
    //
    addStyleSheet(url_css);
    
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
    
    

    
    // -------------------------------------------
    //                 constructor:
    // -------------------------------------------
    
    function Rect(left, top, width, height) {
        //
        if (left instanceof Rect) {
            var rect = left;
            //
            this.left = rect.left;
            this.top = rect.top;
            this.width = rect.width;
            this.height = rect.height;
        } else {
            this.left = left || 0;
            this.top = top || 0;
            this.width = width || 0;
            this.height = height || 0;
        }
    }
    
    // -------------------------------------------
    //            static functions:
    // -------------------------------------------
    
    Rect.getElementRect = function (element) {
        var $element = $(element);
        var offset = $element.offset();
        var width = $element.width();
        var height = $element.height();
        //
        return new Rect(offset.left, offset.top, width, height);
    };
    
    Rect.getWindowRect = function () {
        var $window = $(window);
        //
        var top = $window.scrollTop();
        var width = $window.width();
        var height = $window.height();
        //
        return new Rect(0, top, width, height);
    };
    
    Rect.getCenteredRect = function (width, height, windowRect) {
        if (!windowRect) windowRect = Rect.getWindowRect();
        //
        var left = windowRect.left + (windowRect.width - width) / 2;
        var top = windowRect.top + (windowRect.height - height) / 2;
        //
        if (left < 0) left = 0;
        if (top < 0) top = 0;
        //
        return new Rect(left, top, width, height);
    };
    
    
    // -------------------------------------------
    //            member functions:
    // -------------------------------------------
    
    /*
    Rect.prototype.applyTo = function (element) {
        var $element = $(element);
        //
        $element.css("top", this.top);
        $element.css("left", this.left);
        $element.width(this.width);
        $element.height(this.height);
    }
    
    Rect.prototype.animateTo = function (element, duration, callback) {
        var $element = $(element);
        //
        return $element.animate({
            left: this.left,
            top: this.top,
            width: this.width,
            height: this.height
        }, duration, callback);
    }
    
    */
    
    function ZoomPopup() {
        this._init();
    }
    
    
    (function () {
    
        // -------------------------------------------
        //                 Public:
        // -------------------------------------------
    
        ZoomPopup.prototype.startHide = function () {
            this._startHide();
        };
    
        ZoomPopup.prototype.startShow = function ($thumb) {
            this._startShow($thumb);
        };
    
        ZoomPopup.prototype.startShowError = function () {
            this._startShowError();
        };
    
        ZoomPopup.prototype.startShowImage = function () {
            this._startShowImage();
        };
    
        // -------------------------------------------
        //                 Constants:
        // -------------------------------------------
    
        var DURATION_ZOOM_IN_LOADING = 500;
        var DURATION_ZOOM_IN_SHOW = 300;
        var DURATION_ZOOM_OUT = 400;
    
        var MIN_WIDTH = 200;
        var MIN_HEIGHT = 150;
        var BORDER = 5;
        var INDENT = 30;
    
        // -------------------------------------------
        //                 _init():
        // -------------------------------------------
    
        ZoomPopup.prototype._init = function () {
    
            var that = this;
    
            function getPopupHtml() {
                var html = '';
                //
                html += '<div class="img-zoom-popup img-zoom-hidden cursor-zoom-out"> \r\n';
                html += '    <img class="img-zoom-loading" src="img/image-loading.gif"  /> \r\n';
                html += '    <a href="#" target="_blank" class="img-zoom-a-big"><img class="img-zoom-large" /></a> \r\n';
                html += '    <p class="img-zoom-error"> \r\n';
                html += '        <span>Error loading image:</span><br /> \r\n';
                html += '        <a href="img/normal1.gif">http://xxxxx.gif</a> \r\n';
                html += '    </p> \r\n';
                html += '</div> \r\n';
                //
                return html;
            }
    
            function createElements(html) {
                that.$div = $(html);
                that.$imgLoading = $(".img-zoom-loading", that.$div);
                that.$imgLarge = $(".img-zoom-large", that.$div);
                that.$aBig = $(".img-zoom-a-big", that.$div);
                that.$pError = $(".img-zoom-error", that.$div);
                that.$aError = $(".img-zoom-error a", that.$div);
            }
    
            function createMemberVariables() {
                that.$thumb = null;
                //
                that.fullSize = null;
                that.handleResizeActive = false;
                that.useMinRect = false;
            }
    
            function addBigLinkClickHandler() {
                that.$aBig.click(function (evt) {
                    if (!that._isBigLinkEnabled()) {
                        evt.preventDefault();
                    }
                });
            }
    
            function addWindowResizeHandler() {
                $(window).resize(_debounce(function () {
                    if (that.handleResizeActive) that._resizePopup();
                }, 150));
            }
    
            function addPopupToPageBody() {
                $("body").append(that.$div);
            }
    
            createElements(getPopupHtml());
            createMemberVariables();
            addBigLinkClickHandler();
            addWindowResizeHandler();
            addPopupToPageBody();
    
        };
    
        // -------------------------------------------
        //                 _setView():
        // -------------------------------------------
    
        var VIEW_HIDDEN = 0;
        var VIEW_LOADING = 1;
        var VIEW_ERROR = 2;
        var VIEW_IMAGE = 3;
    
        ZoomPopup.prototype._setView = function (view) {
    
            function setVisible($element, visible) {
                if (visible) $element.show(); else $element.hide();
            }
    
            if (view == VIEW_HIDDEN) this.$div.addClass("img-zoom-hidden");
            //
            setVisible(this.$imgLoading, view === VIEW_LOADING);
            setVisible(this.$imgLarge, view === VIEW_IMAGE);
            setVisible(this.$pError, view === VIEW_ERROR);
            //
            if (view === VIEW_ERROR) {
                this.$aError.prop("href", this.$imgLarge.prop("src"));
                this.$aError.text(this.$imgLarge.prop("src"));
            }
            //
            if (view != VIEW_HIDDEN) this.$div.removeClass("img-zoom-hidden");
        };
    
        // -------------------------------------------
        //                BigLink:
        // -------------------------------------------
    
        ZoomPopup.prototype._enableBigLink = function () {
            this.$aBig.prop("href", this.$imgLarge.prop("src"));
            //
            this.$imgLarge.removeClass("cursor-zoom-out");
            this.$imgLarge.addClass("cursor-zoom-in");
        };
    
        ZoomPopup.prototype._disableBigLink = function () {
            this.$aBig.prop("href", "#");
            //
            this.$imgLarge.removeClass("cursor-zoom-in");
            this.$imgLarge.addClass("cursor-zoom-out");
        };
    
        ZoomPopup.prototype._isBigLinkEnabled = function () {
            return this.$imgLarge.hasClass("cursor-zoom-in");
        };
    
        // -------------------------------------------
        //                utilites:
        // -------------------------------------------
    
        function calcPopupRect(width, height, windowRect) {
            if (!windowRect) windowRect = Rect.getWindowRect();
            //
            var left = (windowRect.width - width) / 2;
            var top = (windowRect.height - height) / 2;
            //
            if (left < INDENT) left = INDENT;
            if (top < INDENT) top = INDENT;
            //
            return new Rect(windowRect.left + left, windowRect.top + top, width, height);
        }
    
        function calcPopupMinRect() {
            var windowRect = Rect.getWindowRect();
            var minRect = calcPopupRect(MIN_WIDTH, MIN_HEIGHT, windowRect);
            return minRect;
        }
    
        function calcPopupLoadTargetRect() {
            var windowRect = Rect.getWindowRect();
            var popupRect = calcPopupRect(windowRect.width / 2, windowRect.height / 2, windowRect);
            return popupRect;
        }
    
        // -------------------------------------------
        //                _animatePopup():
        // -------------------------------------------
    
        // _animatePopup(rect, duration, opacity, callback = undefined)
        // _animatePopup(rect, duration, callback = undefined)
        ZoomPopup.prototype._animatePopup = function (rect, duration, opacity, callback) {
            if (typeof (opacity) == "function") {
                callback = opacity;
                opacity = 1;
            }
            //
            if (opacity === undefined) opacity = 1;
            //
            this.$div.animate({
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                opacity: opacity
            }, duration, callback);
        };
    
        // -------------------------------------------
        //                _resizePopup():
        // -------------------------------------------
    
        ZoomPopup.prototype._resizePopup = function () {
            if (this.useMinRect) {
                this._animatePopup(calcPopupMinRect(), DURATION_ZOOM_IN_SHOW);
                return;
            }
            //
            var windowRect = Rect.getWindowRect();
            //
            var space = (INDENT + BORDER) * 2;
            var useFullSize = (this.fullSize.width <= MIN_WIDTH) || ((this.fullSize.width + space) <= windowRect.width);
            if (useFullSize) {
                var largeRect = calcPopupRect(this.fullSize.width, this.fullSize.height, windowRect);
                this._animatePopup(largeRect, DURATION_ZOOM_IN_SHOW);
                //
                this.$imgLarge.width("");
                //
                this._disableBigLink();
            } else {
                var popup_width = windowRect.width - space;
                var popup_height = calcResizedHeight(this.fullSize, popup_width);
                //
                var resizedRect = calcPopupRect(popup_width, popup_height, windowRect);
                //
                if (this.$imgLarge.width() < popup_width) {
                    this.$imgLarge.width(popup_width);
                    this._animatePopup(resizedRect, DURATION_ZOOM_IN_SHOW);
                } else {
                    var that = this;
                    this._animatePopup(resizedRect, DURATION_ZOOM_IN_SHOW, function () {
                        that.$imgLarge.width(popup_width);
                    });
                }
                //
                this._enableBigLink();
            }
        };
    
        // -------------------------------------------
        //                Public implementation:
        // -------------------------------------------
    
        ZoomPopup.prototype._startHide = function () {
            var that = this;
            this.handleResizeActive = false;
            var thumbRect = Rect.getElementRect(this.$thumb);
            this._animatePopup(thumbRect, DURATION_ZOOM_OUT, 0.3, function () {
                that._setView(VIEW_HIDDEN);
            });
        };
    
    
        ZoomPopup.prototype._startShow = function ($thumb) {
            this.$thumb = $thumb;
            //
            var thumbRect = Rect.getElementRect($thumb);
            this._animatePopup(thumbRect, 0, 0.3);
            //
            this._setView(VIEW_LOADING);
            this.$imgLarge.width("");
            //
            var popupRect = calcPopupLoadTargetRect();
            this._animatePopup(popupRect, DURATION_ZOOM_IN_LOADING);
            //
            this._disableBigLink();
        };
    
        ZoomPopup.prototype._startShowError = function () {
            this.$div.stop();
            //
            this.useMinRect = true;
            this.fullSize = { width: MIN_WIDTH, height: MIN_HEIGHT };
            this._animatePopup(calcPopupMinRect(), DURATION_ZOOM_IN_SHOW);
            this._setView(VIEW_ERROR);
            //
            this.handleResizeActive = true;
        };
    
        ZoomPopup.prototype._startShowImage = function () {
            this.$div.stop();
            //
            this._setView(VIEW_IMAGE);
            //
            var largeSize = getImageNaturalSize(this.$imgLarge);
            this.fullSize = largeSize;
            //
            var largeIsSmall = ((largeSize.width < MIN_WIDTH) && (largeSize.height < MIN_HEIGHT));
            if (largeIsSmall) {
                this.useMinRect = true;
                this.$imgLarge.addClass("img-zoom-large-low");
                this._animatePopup(calcPopupMinRect(), DURATION_ZOOM_IN_SHOW);
            } else {
                this.useMinRect = false;
                this.$imgLarge.removeClass("img-zoom-large-low");
                //
                this._resizePopup();
            }
            //
            this.handleResizeActive = true;
        };
    
    
    }());
    
    
    
    
    
    function getImageNaturalSize($imgElement) {
        var width = 10;
        var height = 10;
        //
        var imgElement = $imgElement[0];
        if (imgElement.naturalWidth !== undefined) {
            width = imgElement.naturalWidth;
            height = imgElement.naturalHeight;
        } else {
            var i = new Image();
            i.src = imgElement.src;
            width = i.width;
            height = i.height;
        }
        //
        return { width: width, height: height, toString: function () { return width + "x" + height; } };
    }
    
    
    function loadImage($imgElement, src, callback) {
        //
        if (src) {
            //$element.attr("src", "");
            $imgElement.attr("src", src);
        }
        //
        //
        if (!loadImage.failedSrcs) {
            loadImage.failedSrcs = {};
        } else {
            if (loadImage.failedSrcs[src]) {
                callCallback(false, "error");
                return;
            }
        }
        //
        function callCallback(ok, status) {
            setTimeout(function () { callback(ok, status); }, 10);
        }
        //
    
        function unbind() {
            $imgElement.off("load.img-zoom");
            $imgElement.off("error.img-zoom");
        }
        //
        //
        var img = $imgElement[0];
    
        //function waitLoadComplete() {
        //    if (img.complete) {
        //        callCallback(true, "loaded:" + img.complete);
        //    } else {
        //        setTimeout(waitLoadComplete, 50);
        //    }
        //}
    
        if (img.complete) {
            callCallback(true, "complete");
        } else {
            $imgElement.on("load.img-zoom", function () {
                unbind();
                callCallback(true, "loaded");
                //waitLoadComplete();
            });
            $imgElement.on("error.img-zoom", function () {
                unbind();
                loadImage.failedSrcs[src] = true;
                callCallback(false, "error");
            });
        }
    }
    
    
    
    function ZoomBackground() {
        var html = '<div class="img-zoom-background cursor-zoom-out"></div>';
        //
        this.$background = $(html);
        $("body").append(this.$background);
        //
        this.$background.fadeOut(0);
    }
    
    ZoomBackground.prototype.startShow = function () {
        this.$background.fadeIn();
    };
    
    ZoomBackground.prototype.startHide = function () {
        this.$background.fadeOut();
    };
    
    
    
    function calcResizedHeight(originalSize, resizedWidth) {
        return (originalSize.height * resizedWidth) / originalSize.width;
    }
    
    var _now = Date.now || function () { return new Date().getTime(); };
    
    /*var _throttle = function (func, wait, options) {
        var context, args, result;
        var timeout = null;
        var previous = 0;
        options || (options = {});
        var later = function () {
            previous = options.leading === false ? 0 : _now();
            timeout = null;
            result = func.apply(context, args);
            context = args = null;
        };
        return function () {
            var now = _now();
            if (!previous && options.leading === false) previous = now;
            var remaining = wait - (now - previous);
            context = this;
            args = arguments;
            if (remaining <= 0) {
                clearTimeout(timeout);
                timeout = null;
                previous = now;
                result = func.apply(context, args);
                context = args = null;
            } else if (!timeout && options.trailing !== false) {
                timeout = setTimeout(later, remaining);
            }
            return result;
        };
    };*/
    
    var _debounce = function (func, wait, immediate) {
        var timeout, args, context, timestamp, result;
    
        var later = function () {
            var last = _now() - timestamp;
            if (last < wait) {
                timeout = setTimeout(later, wait - last);
            } else {
                timeout = null;
                if (!immediate) {
                    result = func.apply(context, args);
                    context = args = null;
                }
            }
        };
    
        return function () {
            context = this;
            args = arguments;
            timestamp = _now();
            var callNow = immediate && !timeout;
            if (!timeout) {
                timeout = setTimeout(later, wait);
            }
            if (callNow) {
                result = func.apply(context, args);
                context = args = null;
            }
    
            return result;
        };
    };
    
    

    
    // put everything into a local scope:
    (function () {
        "use strict";
    
        var CLASS_CURSOR_ZOOM_IN = "cursor-zoom-in";   // CSS class to add the zoom-in cursor
        var CLASS_CURSOR_ZOOM_OUT = "cursor-zoom-out"; // CSS class to add the zoom-out cursor
    
        var url_script = calcScriptSrc(); // this script URL, e.g. "http://localhost:18071/lib/cursor-zoom/cursor-zoom.js"
        var url_dir = calcDirUrl(url_script); // script directory URL, e.g. "http://localhost:18071/lib/cursor-zoom/"
    
        // the style code:
        var cssCode = 
            "." + CLASS_CURSOR_ZOOM_IN + " { " +
                "cursor: url(" + url_dir + "zoom-in.cur), pointer;" +
                "cursor: zoom-in;" +
                "cursor: -moz-zoom-in;" +
                "cursor: -webkit-zoom-in;" +
            "}" +
            "." + CLASS_CURSOR_ZOOM_OUT + " {" +
                "cursor: url(" + url_dir + "zoom-out.cur), pointer;" +
                "cursor: zoom-out;" +
                "cursor: -moz-zoom-out;" +
                "cursor: -webkit-zoom-out;" +
            "}" 
        ;
    
        addCss(cssCode);
    
        // ----------------------------------------------------------
        //                      functions:
        // ----------------------------------------------------------
    
        // returns src property of the <script> tag currently processing by browser (i.e. this script file URL)
        // must be callid directly in the script, will not works inside "$(document).ready()"
        function calcScriptSrc() {
            var scripts = document.getElementsByTagName("script");
            return scripts[scripts.length - 1].src;
        }
    
        // returns directory URL (including the trailing slash) for the given file URL
        function calcDirUrl(scriptUrl) {
            var p = scriptUrl.lastIndexOf('/');
            return scriptUrl.substr(0, p + 1);
        }
    
        // adds the css code to a new <style> tag to the page <head>
        // http://yuiblog.com/blog/2007/06/07/style/
        function addCss(cssCode) {
            var styleElement = document.createElement("style");
            styleElement.type = "text/css";
            if (styleElement.styleSheet) {
                styleElement.styleSheet.cssText = cssCode;
            } else {
                styleElement.appendChild(document.createTextNode(cssCode));
            }
            document.getElementsByTagName("head")[0].appendChild(styleElement);
        }
    
    })(); // end of local scope

    
    
    $().ready(function () {
    
        // -------------------------------------------
        //                 Variables:
        // -------------------------------------------
    
        var background = new ZoomBackground();
        var popup = new ZoomPopup();
    
        // -------------------------------------------
        //                   Setup:
        // -------------------------------------------
    
        $("img[data-izin]").addClass("cursor-zoom-in").click(function () {
            zoom_in($(this));
        });
    
        background.$background.click(function () {
            zoom_out();
        });
    
    
        popup.$div.click(function () {
            zoom_out();
        });
    
        // -------------------------------------------
        //                   Main:
        // -------------------------------------------
    
        function calcLargeSrc($img) {
            var src = $img.attr("data-izin");
            if (!src) src = $img.attr("src");
            return src;
        }
    
        function zoom_in($img) {
            background.startShow();
            //
            popup.startShow($img);
            //
            loadImage(popup.$imgLarge, calcLargeSrc($img), function (ok) {
                if (!ok) {
                    popup.startShowError();
                } else {
                    popup.startShowImage();
                }
            });
        }
    
        function zoom_out() {
            background.startHide();
            popup.startHide();
        }
    
    }); // $().ready(...
    

})(jQuery); // end of local scope
