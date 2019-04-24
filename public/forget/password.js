$(function () {
   


    $(document).on("click", ".btn", function () {
        var animateTime = 1000;

        function getUrlData(url){
            // var url = location.href;
            
            // 获取URL string
            var queryString = url.split("?")[1];
            
			
			if(!queryString){
				return {}
			}
			
            // 截取每一个 数据对象
            var smallData = queryString.split("&");
			
			
			
            var data = {}
    
            smallData.forEach(function(item, index){
                data[item.split("=")[0]] = item.split("=")[1]
            })
    
            return data;
        }


        var password1 = $(".password1").val();
        var password2 = $(".password2").val();


        if (password1 == '' || password2 == '') {
            $.toast("密码不能为空", animateTime)
            return;
        }
        if (password1 && password2.length < 4) {
            $.toast("密码长度不得小于4位", animateTime)
            return;
        }
        if (password2 === password1) {
            // alert("成功");
            var urlData = getUrlData(window.location.href);

            var data = {
                key: urlData.key,
                password: password2
            }
            var hostBase = 'https://maghex.ipitaka.com/api';
            $.ajax({
                url: hostBase + "/app/users/changePassword",
                type: 'post',
                data: data,
                success: function (data) {
					var url = "./resetResult/result.html?result="
					if(data.msg){
						url += "1"
					}else {
						url += "0"
					}
                    window.location.href = url;
                }
            });
        } else {
            $.toast("Old password is not the same as the current password!", animateTime)
        }
    });
})