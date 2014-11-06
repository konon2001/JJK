$(document).ready( function(){




    function view( exp ){
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/vms/experiment/view");
        form.setAttribute("target", "/vms/experiment/view");

        var jForm = $(form);

        var input = document.createElement("input");
        input.type = "hidden";
        input.name = "exp";
        input.value = exp;
        $(input).appendTo(jForm);
        //.appendChild(input);



        //alert("view!"+input.value);
        hWndHelp = window.open('', '/vms/experiment/view', 'width=1188, height=840, resizable= no');
        hWndHelp.focus();


        jForm.appendTo('body').submit();
        //alert("view!2"+input.value);
        try {
            // document.body.removeChild(form);
        }catch( e ){
            console.log( "removeChild", e );
        }
    }
    var cnt = 0;
    function view2( exp ){
        var form = document.createElement("form");
        form.setAttribute("method", "get");
        form.setAttribute("action", "http://211.189.19.129:4200");
        form.setAttribute("target", "http://211.189.19.129:4200");

        var jForm = $(form);

        var input = document.createElement("input");
        input.type = "hidden";
        input.name = "exp";
        input.value = exp;
        $(input).appendTo(jForm);
        //.appendChild(input);



        //alert("view!"+input.value);
        hWndHelp = window.open('http://211.189.19.129:4200', ''+(cnt++), 'width=1188, height=840, resizable= no');
        hWndHelp.focus();


        jForm.appendTo('body').submit();
        //alert("view!2"+input.value);
        try {
            // document.body.removeChild(form);
        }catch( e ){
            console.log( "removeChild", e );
        }
    }



    $('#btn-viewer-exp1').on('click', function(){
        console.log('exp1 click');
        view(1);
    });
    $('#btn-viewer-exp2').on('click', function(){
        console.log('exp2 click');
        view(2);
    });
    $('#btn-viewer-exp3').on('click', function(){
        console.log('exp2 click');
        view2(2);
    });
    $('#ssh-cont').load('http://211.189.19.129:4200');







});
