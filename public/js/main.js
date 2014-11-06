
var SPICE_URL = "http://211.189.20.71:8095";


setOnContext = function( selector, vmBox ){
    $.contextMenu({
        selector: selector,
        callback: function(key, options) {
            //var m = "clicked: " + key;
            //window.console && console.log(m) || alert(m);

            //$(selector).blur();/
            switch( key ){
                case "delete":
                    var modal = $('#myModal');

                    modal.find('.delete').off('click').one('click', function(e){

                        var progressCircle = new ajaxLoader(modal.find('.panel-heading'), {classOveride: 'blue-loader'});
                        $.ajax({
                            url:'/vms/delete',
                            type:"post",
                            data: { uuid: vmBox.getUUID() },
                            datatype: 'json',
                            success: function( data ){
                                if( progressCircle ) progressCircle.remove();
                                vmBox.clear();
                                modal.modal('hide');
                            },
                            error:function(err){
                                if( progressCircle ) progressCircle.remove();
                                alert('error'+err);
                            }
                        });
                    });
                    modal.css({
                        top : '10%',
                        left : '0'
                    });
                    modal.draggable();
                    var str = '계속 진행하면 당신의 가상머신 ['+vmBox.getName()+'] 은 영원히 삭제되며, 가상머신의 데이터는 복구할 수 없습니다.';
                    modal.find('.modal-body p').text( str );
                    modal.modal('show');

            }
        },
        items: {
            "delete": {name: "Delete", icon: ""},

            /*            "sep1": "---------",
             "quit": {name: "Quit", icon: "quit"}*/
        }
    });
}


VmBox = function( $container, uuid ){


    console.log( 'virtual box', $container, uuid );
    var json;
    var currentState = "stop";

    function coloring( state ){
        switch( state ){
            case "running":
                $container.find('.vm-box').switchClass( "panel-default", "panel-primary");
                //$container.find('.vm-box').switchClass( "inactbox", "actbox", 500, "easeInOutQuad");
                //$container.find('.vm-box').switchClass( "inactbox", "actbox", 500, "easeInOutQuad");
                break;
            case "stopped":
                $container.find('.vm-box').switchClass( "panel-primary", "panel-info", 500, "easeInOutQuad");
                break;
            default:
                break;
        }
        switch( state ){
            case "running":
                $container.find('.vm-box').switchClass( "panel-default inactbox", "panel-primary actbox", 500, "easeInOutQuad");
                break;
            case "stopped":
                $container.find('.vm-box').switchClass( "panel-default inactbox", "panel-info inactbox", 500, "easeInOutQuad");
                break;
            default:
                break;
        }
    }

    function view(){
        console.log( 'view!!');
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/vms/view");
        form.setAttribute("target", "/vms/view");

        var jForm = $(form);

        var input = document.createElement("input");
        input.type = "hidden";
        input.name = "uuid";
        input.value = uuid;
        $(input).appendTo(jForm);
        //.appendChild(input);



        //alert("view!"+input.value);
        hWndHelp = window.open('', '/vms/view', 'width=1188, height=840, resizable= no');
        hWndHelp.focus();


        jForm.appendTo('body').submit();
        //alert("view!2"+input.value);
        try {
            // document.body.removeChild(form);
        }catch( e ){
            console.log( "removeChild", e );
        }
    }


    function setStateLine( state ){


        if( currentState === state ) return;

        var $button = $container.find('#btn-runner');
        $container.find('.state').text( state );
        currentState = state;
        switch( state ){
            case "running":
                $button.val('running');
                $button.find('.ladda-label').text('stop');
                $button.switchClass("btn-warning","btn-primary");
                $container.find('.vm-box').removeClass('panel-default');
                $container.find('.vm-box').removeClass('panel-info');
                $container.find('.vm-box').addClass('panel-primary');
                break;
            case "stopped":
                $button.val( 'stopped' );
                $button.find('.ladda-label').text('run');
                $button.switchClass( "btn-primary", "btn-warning");
                $container.find('.vm-box').removeClass('panel-default');
                $container.find('.vm-box').removeClass('panel-primary');
                $container.find('.vm-box').addClass('panel-info');
                $container.find('.vm-box').switchClass( "panel-primary", "panel-info", 500, "easeInOutQuad");
                break;
            default:
                break;
        }
    }

    function getDetailInfo( success, error ){
        $.ajax(
            {
                url: '/vms/detail',
                type:'post',
                datatype :'json',
                data : { uuid : uuid },
                success:success,
                error: error
            }
        );
    }

    function getDetailInfoWhileState( state, success, error ){
        getDetailInfo( function( data ){
            if( data.state == state ){
                success(data);
            }else{
                setStateLine( data.state );
                getDetailInfoWhileState( state, success, error );
            }
        },function(err){
            error(err);
        });
    }
    function init(){
        var vmbox1 = new ajaxLoader($container.find('.panel-heading'), {classOveride: 'blue-loader'});
        console.log( "uuid", uuid );
        var $button = $container.find('#btn-runner');
        var l = Ladda.create( $button[0] );
        $button.on('click', function(){
            l.start();
        })
        if( true ) return;
        $.ajax({
            url: '/vms/detail',
            type:'post',
            datatype :'json',
            data : { uuid : uuid },
            success: function( data ){
                //set layout
                json = data;
                console.log( "Virtaul zones info:", data );
                if( vmbox1 ) vmbox1.remove();

                $container.find('.vm-box').switchClass( "inactbox", "actbox", 500, "easeInOutQuad");

                setStateLine( data.state );
                $container.find('.panel-heading').text(data.alias);
                $container.find('.cpu').text( data.vcpus + " core" );
                $container.find('.ram').text( data.ram + " MB" );

                if( data.disks.length > 0 ){
                    $container.find('.storage').text( data.disks[0].size + " MB" );
                }

                $container.find('#btn-viewer').on('click', function(){
                    view();

                });



                $button.on('click', function(event){
                    if( currentState === 'stopped'){
                        l.start();
                        var url = '/vms/start';
                        $.ajax({
                            url: url,
                            type: 'post',
                            datatype: 'json',
                            data: { uuid: uuid },
                            success: function(data){
                                if( data.state === 'running' ) {
                                    setStateLine( data.state );
                                    l.stop();
                                }else{
                                    getDetailInfoWhileState( 'running' ,
                                        function( data ){
                                            setStateLine( data.state );
                                            l.stop();
                                        },
                                        function( err ){
                                            l.stop();
                                            alert('error : '+err );

                                        }
                                    )
                                }
                            },
                            error: function( data ){
                                l.stop();
                                alert('error : '+data );
                            }
                        });
                    }else if( currentState==='running'){
                        l.start();
                        var url = '/vms/stop';
                        $.ajax({
                            url: url,
                            type: 'post',
                            datatype: 'json',
                            data: { uuid: uuid },
                            success: function(data){
                                if( data.state === 'stopped' ) {
                                    setStateLine( data.state );
                                    l.stop();
                                }else{
                                    getDetailInfoWhileState( 'stopped' ,
                                        function( data ){
                                            setStateLine( data.state );
                                            l.stop();
                                        },
                                        function( err ){
                                            l.stop();
                                            alert('error : '+err );

                                        }
                                    )
                                }
                            },
                            error: function( data ){
                                l.stop();
                                alert('error : '+data );
                            }
                        });
                    }
                });
            },
            error:function( err ){
                console.log( "error", err  );
                $container.find('.panel-heading').text('loading fail');
                if( vmbox1 ) vmbox1.remove();
            }
        });
    }
    init();

    function setState( state, callback, error ){
        var url = null;

        switch( state ){
            case "run":
                url = '/vms/start';
                break;
            case "stop":
                url = '/vms/stop';
                break;
        }

        if( url ) {
            var vmbox1 = new ajaxLoader($container.find('.panel-heading'), {classOveride: 'blue-loader'});
            $.ajax({
                url: url,
                type: 'post',
                datatype: 'json',
                data: { uuid: uuid },
                success: function(data){
                    if( vmbox1 ) vmbox1.remove();
                    callback(data);
                },
                error: error
            });
        }
    }

    return{
        setState : setState,
        getPort : function(){
            return 27012;
        },
        getUUID: function(){
            return uuid;
        },
        getName : function(){
            if( json )
                return json.alias;
            return undefined;
        },
        clear: function(){
            $container.remove();
        },
        reload : function() {
            //init();
        }
    }
};


VmDialog = function( $container, $opener, obj ){
    var cbOpen = null;
    var cbSuccess = null;
    var cbClose = null;

    $container.draggable();

    if( obj ){
        cbOpen = obj.open;
        cbClose = obj.close;
        cbSuccess = obj.success;
    }

    function close(){
        if (cbOpen){
            cbOpen();
        }
        console.log( 'vmd close ');
        $container.css({
            top : '0',
            left : '0'

        });
    }
    function success(){
        console.log( "success");
        if (cbSuccess){
            console.log( "success2");
            cbSuccess($container.find( '.modal-content'));
        }

    }
    function open(){
        if( cbClose ){
            cbClose();
        }
    }
    if( $container ) {
        $container.find('.vd-close').on('click', function () {
            //close();
        });
        $container.find('.vd-gen').on('click', function () {
            console.log( "gen")
            var alias = $('#pc-name').val();
            var os = $('#dropdown-os').val();
            var vcpus = $('#slide-cpu').val();
            var ram = $('#slide-mem').val();

            if( os && os.length > 0 ){
                console.log( "create vm", "alias:"+alias+" os:"+os+" vcpu:"+vcpus+" "+ram );

                var val = {
                    alias : alias,
                    os : os,
                    vcpus : vcpus,
                    ram : ram*512
                }

                $.ajax({
                    url:'/vms/create',
                    type:"post",
                    data: val,
                    datatype: 'json',
                    success: function( uuid ){
                        console.log( "createvm ok", uuid )
                        var $vm = $(
                                '<div id="vm-'+uuid+'" class="vm-cont col-lg-4">'+
                                '<div class="panel panel-default vm-box inactbox">'+
                                '<div class="panel-heading">'+
                                'loading...'+
                                '</div>'+
                                '<div class="panel-body" style="overflow: auto">'+
                                '<div class="info-conatiner">'+
                                '<div class="row vm-info state">'+
                                '</div>'+
                                '<div class="row vm-info cpu">'+
                                '</div>'+
                                '<div class="row vm-info ram">'+
                                '</div>'+
                                '<div class="row vm-info storage">'+
                                '</div>'+
                                '</div>'+
                                '</div>'+
                                '</div>'+
                                '</div>'
                        )
                        setOnContext( '#vm-'+uuid, new VmBox( $vm, uuid ) );
                        $('#cont-vm-add').before( $vm );
                    },
                    error:function(){
                        console.log( "insert err")
                    }
                });

            }
            success();
        });
        $container.on('hidden.bs.modal', function(){
            close();
        });
        $container.on('show.bs.modal', function(){
            $('.well .slider').css({width:"100%"});
            $('.tooltip.top').css({
                marginTop:"-20px"
            });
            $('#pc-name').val("");
            $('#dropdown-os').text( '운영체제 ').append( $("<span class='caret'></span>"));
            $('#dropdown-os').val( "" );
            $('#slide-cpu').slider('setValue', 1 );
            $('#slide-mem').slider('setValue', 1 );
        });
    }
    if( $opener ){
        $opener.on('click', function(){
            open();
        });
    }
    return {
        close : function(data){
            close();

        },
        open : function(data){

        },
        success :function(data){

        }
    }
};


$(document).ready( function(){

    var dialog, form;
    dialog = new VmDialog( $("#new-vm-dialog"), $('#btn-vm-add'), {
        open: function(){
        },
        close : function(){
        },
        success: function($container){
            //box1 = new ajaxLoader($container, {classOveride: 'blue-loader'});
        }
    });



    function clearProgress(){
        dialog.data('callback').valid();
        dialog.dialog( "close" );
    }



    function listup( objs ){
        objs.forEach( function( value, index ){
            var $vm = $(
                    '<div id="vm-'+value.uuid+'" class="vm-cont col-lg-4">'+
                        '<div class="panel panel-default vm-box actbox">'+
                            '<div class="panel-heading">'+
                                'loading...'+
                            '</div>'+
                            '<div class="panel-body" style="overflow: auto">'+
                                '<div class="info-conatiner">'+
                                    '<div class="row vm-info state">'+
                                    '</div>'+
                                    '<div class="row vm-info cpu">'+
                                    '</div>'+
                                    '<div class="row vm-info ram">'+
                                    '</div>'+
                                    '<div class="row vm-info storage">'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                            '<div class="panel-footer">'+
                                '<button id="btn-runner" class="controller btn btn-primary ladda-button" style="padding: 6px 24px;font-size: 15px;"data-style="slide-left" value="default"><span class="ladda-label">stop</span></button>'+
                                '<button id="btn-viewer" class="controller btn btn-primary" style="padding: 6px 24px;font-size: 15px;">view</button>'+
                            '</div>'+
                        '</div>'+

                    '</div>'
            )
            setOnContext( '#vm-'+value.uuid, new VmBox( $vm, value.uuid ) );
            $('#cont-vm-add').before( $vm );
        });
    }

    function loadVirtualMachine(){
        var progressBar = new ajaxLoader($('.container'), {classOveride: 'blue-loader', overWidth:'100%', overHeight:'100%'});
        $.ajax({
            url:'/vms/getvms',
            type:"post",
            datatype: 'json',
            success: function( data ){
                console.log( "vm data", data );
                listup( data.vms );
                if( progressBar ) progressBar.remove();
            },
            error:function(){
                if( progressBar ) progressBar.remove();
            }
        });
    }
    loadVirtualMachine();


    $("#btn-vm-add")
        .on('focus', function(){
            this.blur();
        })
        .on('click', function(){
            $("#new-vm-dialog").show();
        });


    $('.dropdown-menu li a').click(function(){
        $('#dropdown-os').text( $(this).text()+' ').append( $("<span class='caret'></span>"));
        $('#dropdown-os').val( $(this).data('value') );
    });


    $('#slide-cpu').slider({
        formater: function(value) {
            return value + ' Core';
        }
    });
    $('#slide-mem').slider({
        formater: function(value) {
            return value*512 + ' MB';
        }
    });

    var l = Ladda.create( document.querySelector( '#testdd' ) );

// Start loading
    l.start();


    /*
     var period = 2000;
     setInterval( function(){
     $.ajax({
     url:'/vms/trace',
     type:"get",
     datatype: 'json',
     success: function( data ){
     console.log( 'data', data );
     },
     error:function(){

     }
     });
     }, period);
     */

});
