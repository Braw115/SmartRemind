$(function(){
    $.toast = function(text, timeout, options){
        // 清除上一个toast
        $("div.toast-it").length === 0 || $("div.toast-it").remove()

        var timeout = timeout || 2000;
        var options = options || {};
        var toast = $("<div>");
        toast.addClass("toast-it");
        toast.text(text);
        toast.css("animationDuration", timeout/1000 + "s");

        for (var prop in options) {
            toast.css(prop, options[prop])
        }

        toast.css("z-index", 99999)

        $("body").append(toast)
        setTimeout(function () {
            $("div.toast-it").length === 0 || $("div.toast-it").remove()
        }, timeout);
    }
})