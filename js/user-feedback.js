(function() {
    if(UserFeedback)
        return;
    if (!document.getElementsByClassName) {
        var indexOf = [].indexOf || function(prop) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === prop) return i;
            }
            return -1;
        };
        getElementsByClassName = function(className,context) {
            var elems = document.querySelectorAll ? context.querySelectorAll("." + className) : (function() {
                var all = context.getElementsByTagName("*"),
                    elements = [],
                    i = 0;
                for (; i < all.length; i++) {
                    if (all[i].className && (" " + all[i].className + " ").indexOf(" " + className + " ") > -1 && indexOf.call(elements,all[i]) === -1) elements.push(all[i]);
                }
                return elements;
            })();
            return elems;
        };
        document.getElementsByClassName = function(className) {
            return getElementsByClassName(className, document);
        };
        Element.prototype.getElementsByClassName = function(className) {
            return getElementsByClassName(className, this);
        };
    }
    var UserFeedback = function(options) {
        var _toString = Object.prototype.toString,
            opts = options || {},
            theFeed = this;
        // extend opts
        UserFeedback.defaults.target.length && ( UserFeedback.defaults.target = UserFeedback.defaults.target[0] );
        for(var key in UserFeedback.defaults) {
            (function(key, val, defaultVal) {
                var cond = /HTML/.test( _toString.call(defaultVal) );
                if(cond)
                    cond = /HTML/.test( _toString.call(val) )
                else
                    switch(key) {
                        case "finalTmpl":
                            cond = _toString.call(val) === "[object String]" || _toString.call(val) === "[object Function]";
                            break;
                        default:
                            cond = _toString.call(val) === _toString.call(defaultVal);
                            break;
                    }
                opts[key] = cond ? val : defaultVal;
            })(key, opts[key], UserFeedback.defaults[key]);
        }
        // check memoAttr
        var isMemo = false;
        if( opts.memoAttr.length ) {
            if(localStorage) {
                isMemo = !!localStorage.getItem(opts.memoAttr);
            } else {
                isMemo = new Regexp("(; )?" + opts.memoAttr + "=").test(document.cookie);
            }
        }
        if(isMemo)
            return;
        // append element
        var theDom = null,
            target = opts.target,
            appendMethod = {
                before: "beforebegin",
                after: "afterend",
                append: "beforeend",
                prepend: "afterbegin"
            }, sibling = function( cur, dir ) {
                do {
                    cur = cur[ dir ];
                } while ( cur && cur.nodeType !== 1 );
                return cur;
            };
        target.insertAdjacentHTML(appendMethod[opts.appendMethod], opts.initTmpl);
        switch(opts.appendMethod) {
            case "before":
                theDom = sibling(target, "previousSibling");
                break;
            case "after":
                theDom = sibling(target, "nextSibling");
                break;
            case "append":
                theDom = target.childNodes[target.childNodes.length - 1];
                break;
            case "prepend":
                theDom = target.childNodes[0];
                break;
        }
        // clickEvent
        var clickDoms = theDom.getElementsByClassName(opts.triggerClass);
        clickDoms = clickDoms.length ? clickDoms : [ theDom ];
        var listener = typeof clickDoms[0].addEventListener === "function" ? "addEventListener" : "attachEvent",
            eventType = typeof clickDoms[0].addEventListener === "function" ? "click" : "onclick",
            easing = opts.easing;
        for(var i = 0, _len = clickDoms.length; i < _len; i++) {
            (function(clickDom, theDom) {
                clickDom[listener](eventType, function(e) {
                    e.preventDefault ? e.preventDefault() : (e.returnValue = false);
                    e.stopPropagation ? e.stopPropagation() : (e.cancelBubble = true);
                    var target = e.target || e.srcElement,
                        className = theDom.getAttribute("class") || "",
                        style = theDom.getAttribute("style") || "",
                        finalTmpl = opts.finalTmpl;
                    target.nodeType === 3 && (target = target.parentNode);
                    e.target = target;
                    typeof finalTmpl === "string" && finalTmpl.length && ( theDom.innerHTML = finalTmpl );
                    typeof finalTmpl === "function" && (finalTmpl = finalTmpl(target), finalTmpl.length && ( theDom.innerHTML = finalTmpl ));
                    var delta = 200,
                        times = Math.floor( opts.duration / delta ) - 1,
                        timmer = null,
                        args = Array.prototype.slice.call(arguments);
                    args.push(theFeed);
                    opts.onClick.apply(this, args);
                    if(opts.fadeOut) {
                        timmer = setInterval(function() {
                            times--;
                            var opacity = easing(times * delta, 0, delta, opts.duration) / delta,
                                filter = opacity * delta;
                            theDom.setAttribute("style", style + ";opacity:" + opacity + ";filter:alpha(opacity=" + filter + ");");
                            if(!times) {
                                clearInterval(timmer);
                                timmer = null;
                                times = 0;
                                theDom.parentNode && theDom.parentNode.removeChild(theDom);
                            }
                        }, delta);
                    }
                    if(opts.memoAttr.length) {
                        if(localStorage) {
                            localStorage.setItem(opts.memoAttr, true);
                        } else {
                            document.cookie = escape(opts.memoAttr) + "=true";
                        }
                    }
                });
            })(clickDoms[i], theDom);
        }
        this.theElm = theDom;
        this.options = opts;
        opts.onInit(theFeed);
    };
    UserFeedback.prototype = {
        constructor: UserFeedback
    };
    UserFeedback.defaults = {
        target: document.getElementsByTagName("body"),
        appendMethod: "prepend",
        initTmpl: "<div id='feed-init-tmpl'>this is a desc.</div>",
        finalTmpl: "",
        fadeOut: true,
        triggerClass: "feeling",
        memoAttr: "",
        duration: 4000, // ms
        easing: function(t, b, c, d) {
            return c * t / d + b;
        },
        onInit: function() {},
        onClick: function() {}
    };
    window.UserFeedback = UserFeedback;
})();