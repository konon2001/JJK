/**
 * Created by sungho on 2014-07-19.
 */



$(document).ready( function(){

    $('#btn-login').on('click', function(){
        if( $('#login-username').val().length > 0
            && $('#login-password').val().length > 0 ) {
            $('#loginform').submit();
        }
    });
    $('#btn-signup').on('click', function(){
        console.log("click!!!");
        if( $('#signup-password').val() === $('#signup-confirm').val() ){
            var val =  {username:$('#signup-username').val()};
            console.log("click!!!");
            $.ajax({
                url:'/users/'+val,
                type:"get",
                data: val,
                datatype: 'json',
                success: function( data ){
                    if( data ){
                        alertMessage('중복된 사용자 이름');
                    }
                    else{
                        $('#signupform').submit();
                    }
                },
                error:function(){
                    alertMessage('서버 에러');
                }
            });
        }else{
            $('#signupalert').css({
                "display" : "block"
            }).find('p').text('비밀번호를 확인하세요');
        }
    }).on('focusout', function(){
        $('#signupalert').css({"display" : "none"});
    }).on('blur', function(){
        $('#signupalert').css({"display" : "none"});
    });

    function alertMessage( msg ){
        $('#signupalert').css({
            "display" : "block"
        }).find('p').text(msg);
    }
    $('#btn-more').click(function(){
        var target = $('.content-section-b');
        if( target.length ){
            $('html,body').animate({
                scrollTop: target.offset().top

            }, 500);
            return false;
        }
    });
    $('#btn-sign').click(function(){
        $('.intro-divider').css('visibility', 'hidden');
        $('.intro-social-buttons').css('visibility', 'hidden');
        $('#intro-box').animate({
            top:-180
        }, 400, function(){
            $('#loginbox').show();
        });
    });

});