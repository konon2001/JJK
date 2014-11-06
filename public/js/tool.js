/**
 * Created by sungho on 2014-07-27.
 */

var SPICE_URL = "http://211.189.20.71:8095";

var memCircle = null;
var strCircle = null;
setOnContext = function( selector, vmBox ){

    var val = null;
    if( vmBox.getOsType() === 'console' ){
        val = {
            "delete": {name: "<i class='fa fa-times fa-fw'></i>  Delete", icon: ""},
        }
    }else{
        val = {
            "delete": {name: "<i class='fa fa-times fa-fw'></i>  Delete", icon: ""},
            "expand": {name: "<i class='fa fa-expand fa-fw'></i>  Expand", icon: ""}
        }
    }



    $.contextMenu({
        selector: selector,
        callback: function(key, options) {
            //var m = "clicked: " + key;
            //window.console && console.log(m) || alert(m);
            console.log('key', key );

            //$(selector).blur();/
            switch( key ){
                case "delete":

                    console.log('delete');
                    var modal = $('#delete-vm-dialog');

                    modal.find('.delete').off('click').one('click', function (e) {

                        var progressBar = new ajaxLoader(modal.find('.modal-content'), {classOveride: 'blue-loader', overWidth: '100%', overHeight: '100%'});
                        $.ajax({
                            url: '/vms/delete',
                            type: "post",
                            data: { uuid: vmBox.getUUID() },
                            datatype: 'json',
                            success: function (data) {
                                if (progressBar) progressBar.remove();
                                vmBox.clear();
                                modal.modal('hide');
                            },
                            error: function (err) {
                                if (progressBar) progressBar.remove();
                                alert('error' + err);
                            }
                        });
                    });
                    modal.css({
                        top: '10%',
                        left: '0'
                    });
                    modal.draggable();
                    var str = '계속 진행하면 선택한 가상머신 [' + vmBox.getName() + '] 는 영원히 삭제되며, 가상머신의 데이터는 복구할 수 없습니다.';
                    modal.find('.modal-body p').text(str);
                    modal.modal('show');
                    console.log('delete2');
                    break;

                case "expand":

                    var modal = $('#expand-vm-dialog');
                    modal.find('#slider-storage').val( vmBox.getStorage()/1024 );

                    modal.find('.expand').off('click').one('click', function (e) {
                        console.log('expand!!!', parseInt(modal.find('#slider-storage').val() ) );

                        var progressBar = new ajaxLoader(modal.find('.modal-content'), {classOveride: 'blue-loader', overWidth: '100%', overHeight: '100%'});
                        $.ajax({
                            url: '/vms/expand',
                            type: "post",
                            data: { uuid: vmBox.getUUID(), size: parseInt(modal.find('#slider-storage').val() ) },
                            datatype: 'json',
                            success: function (data) {
                                //if (progressBar) progressBar.remove();
                                //vmBox.clear();
                                vmBox.update();
                                modal.modal('hide');
                            },
                            error: function (err) {
                                if (progressBar) progressBar.remove();
                                alert('error' + err);
                            }
                        });
                    });
                    modal.css({
                        top: '10%',
                        left: '0'
                    });
                    modal.draggable();
                    modal.modal('show');
                    break;

                default:
                    break;

            }
        },
        items: val
    });
}


VmBox = function( $container, uuid, _os ){


    console.log( 'virtual box', $container, uuid );
    var json;
    var currentState = "stop";
    var $button = $container.find('#btn-runner');
    var l = Ladda.create( $button[0] );
    if (!_os) _os = '알수없는 운영체제';

    var ostype = null;
    if( _os == 'winxp' || _os == 'win7' || _os == 'fedora'){
        ostype = 'graphic';
    }else{
        ostype = 'console';
    }


    function view(){
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
        // success #5cb85c
        // warining #f0ad4e
        // 3px solid #e7e7e7

        var $button = $container.find('#btn-runner');
        var $spacer = $container.find('.section-heading-spacer');
        $container.find('.state').text( state );
        $container.find('#btn-viewer').on('click', function(e){
            if( currentState === 'running' ) view();

        });
        currentState = state;
        switch( state ){
            case "running":
                $button.find('.ladda-label').text('종료');
                $spacer.css({
                    borderTop:"5px solid #5cb85c"
                });
                //$button.switchClass("btn-warning","btn-primary");
                //$container.find('.vm-box').removeClass('panel-default');
                //$container.find('.vm-box').removeClass('panel-info');
                //$container.find('.vm-box').addClass('panel-primary');
                break;
            case "stopped":
                $button.find('.ladda-label').text('시작');
                $spacer.css({
                    borderTop:"5px solid #e7e7e7"
                });
                //$button.switchClass( "btn-primary", "btn-warning");
                //$container.find('.vm-box').removeClass('panel-default');
                //$container.find('.vm-box').removeClass('panel-primary');
                //$container.find('.vm-box').addClass('panel-info');
                //$container.find('.vm-box').switchClass( "panel-primary", "panel-info", 500, "easeInOutQuad");
                break;
            case "stopping":
                $button.find('.ladda-label').text('강제종료');
                $spacer.css({
                    borderTop:"5px solid #f0ad4e"
                });
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


    var MAX_RETRY = 5;
    var retry = 0;
    function getDetailInfoWhileState( state, success, error ){
        if( retry > MAX_RETRY ) {
            error(err);
        }else {
            getDetailInfo(function (data) {
                if (data.state == state || !data.state) {
                    success(data);
                } else {
                    setTimeout(function () {
                        setStateLine(data.state);
                        getDetailInfoWhileState(state, success, error);
                    }, 2000);
                }
            }, function (err) {
                error(err);
            });
        }
    }
    function init(){
        var vmbox1 = new ajaxLoader($container.find('.panel-heading'), {classOveride: 'blue-loader'});
        console.log( "uuid", uuid );

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

                setStateLine( data.state );
                $container.find('.section-heading').text(data.alias);
                $container.find('.os').text( _os );

                if( data.vcpus )
                    $container.find('.vcpus').text( data.vcpus + " core" );
                else
                    $container.find('.vcpus').text( "invisible core" );

                if( data.ram )
                    $container.find('.ram').text( data.ram + " MB" );
                else
                    $container.find('.ram').text( "elastic" );

                if( data.disks && data.disks.length > 0 ){
                    $container.find('.storage').text( data.disks[0].size + " MB" );
                }else{
                    $container.find('.storage').text( "elastic" );
                }

                $button.on('click', function(event){
                    if( currentState === 'stopped'){
                        l.start();
                        var url = '/vms/start';
                        $.ajax({
                            url: url,
                            type: 'post',
                            datatype: 'json',
                            data: { uuid: uuid, ostype: ostype },
                            success: function(data){
                                if( data.state === 'running' ) {
                                    setStateLine( data.state );
                                    console.log( 'running!!', data );
                                    l.stop();
                                }else{
                                    retry = 0;
                                    getDetailInfoWhileState( 'running' ,
                                        function( data ){
                                            setStateLine( data.state );
                                            console.log( 'running!!', data )
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
                            data: { uuid: uuid, ostype: ostype },
                            success: function(data){
                                if( data.state === 'stopped' ) {
                                    setStateLine( data.state );
                                    l.stop();
                                }else{
                                    setStateLine( data.state );

                                    retry = 0;
                                    getDetailInfoWhileState( 'stopped' ,
                                        function( data ){
                                            setStateLine( data.state );
                                            l.stop();
                                        },
                                        function( err ){
                                            alert('error : '+err );
                                            l.stop();
                                        }
                                    )
                                }
                            },
                            error: function( data ){
                                l.stop();
                                alert('error : '+data );
                            }
                        });
                    }else if( currentState === 'stopping' ){
                        l.start();
                        var url = '/vms/fstop';
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
                                    retry = 0;

                                    getDetailInfoWhileState( 'stopped' ,
                                        function( data ){
                                            l.stop();
                                            setStateLine( data.state );


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
    function _update(){
        var vmbox1 = new ajaxLoader($container.find('.panel-heading'), {classOveride: 'blue-loader'});
        console.log( "uuid", uuid );

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

                setStateLine( data.state );
                $container.find('.section-heading').text(data.alias);
                $container.find('.os').text( _os );

                if( data.vcpus )
                    $container.find('.vcpus').text( data.vcpus + " core" );
                else
                    $container.find('.vcpus').text( "invisible core" );

                if( data.ram )
                    $container.find('.ram').text( data.ram + " MB" );
                else
                    $container.find('.ram').text( "elastic" );

                if( data.disks && data.disks.length > 0 ){
                    $container.find('.storage').text( data.disks[0].size + " MB" );
                }else{
                    $container.find('.storage').text( "elastic" );
                }
            },
            error:function( err ){
                console.log( "error", err  );
                $container.find('.panel-heading').text('loading fail');
                if( vmbox1 ) vmbox1.remove();
            }
        });

    }

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
        },
        getOs : function(){
            return _os;
        },
        getOsType : function(){
            return ostype;
        },
        getStorage : function(){
            return json.disks[0].size;
        },
        update : function(){
            _update();
        }
    }
};


VmDialog = function( $container, $opener, obj ){
    var cbOpen = null;
    var cbSuccess = null;
    var cbClose = null;

    if( !$container ) return;
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
            top : '20%',
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
        $container.css({
            top : '20%',
            left : '0'

        });
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
            var vcpus = parseInt( $('#slider-cpu').val() );
            var ram = parseInt( $('#slider-ram').val() );

            if( os && os.length > 0 ){
                console.log( "create vm", "alias:"+alias+" os:"+os+" vcpu:"+vcpus+" "+ram );

                var ostype = null;
                if( os == 'winxp' || os == 'win7' || os == 'fedora'){
                    ostype = 'graphic';
                }else{
                    ostype = 'console';
                }
                var val = {
                    alias : alias,
                    os : os,
                    vcpus : vcpus,
                    ram : ram,
                    ostype : ostype
                }

                var progressBar = new ajaxLoader( $container.find('.modal-content'), {classOveride: 'blue-loader', overWidth:'100%', overHeight:'100%'});


                $.ajax({
                    url:'/vms/create',
                    type:"post",
                    data: val,
                    datatype: 'json',
                    success: function( uuid ){
                        console.log( "createvm ok", uuid )
                        var $section=$(
                                '<div class="container">'+
                                '<div class="row">'+
                                '<div class="col-lg-5 col-sm-6">'+
                                '<hr class="section-heading-spacer">'+
                                '<div class="clearfix"></div>'+
                                '<h1 class="section-heading"></h1>'+
                                '<h3 class="os"></h3>'+
                                '<br>'+
                                '<div class="row">'+
                                '<p class="col-sm-3">State</p>'+
                                '<p class="state"></p>'+
                                '</div>'+
                                '<div class="row">'+
                                '<p class="col-sm-3">CPU</p>'+
                                '<p class="vcpus"></p>'+
                                '</div>'+
                                '<div class="row">'+
                                '<p class="col-sm-3">Memory</p>'+
                                '<p class="ram"></p>'+
                                '</div>'+
                                '<div class="row">'+
                                '<p class="col-sm-3">Storage</p>'+
                                '<p class="storage"></p>'+
                                '</div>'+
                                '<p class="lead">Turn your 2D designs into high quality</p>'+
                                '</div>'+
                                '<div class="col-lg-5 col-lg-offset-2 col-sm-6 ">'+
                                '<img class="img-responsive" src="/public/img/phones.png" alt="">'+
                                '</div>'+
                                '</div>'+
                                '<div class="controll-cont">'+
                                '<button id="btn-runner" class="controller col-lg-5 col-sm-5 col-xs-5 ladda-button " data-style="slide-left" value="default"><span class="ladda-label">stop</span></button>'+
                                '<button id="btn-viewer" class="controller col-lg-offset-2 col-lg-5 col-sm-5 col-sm-offset-2 col-xs-5 col-xs-offset-2 ladda-button">view</button>'+
                                '</div>'+
                                '</div>'+
                                '</div>'
                        );
                        if( progressBar ) progressBar.remove();
                        var $container = genVmContainer( $section, uuid );
                        setOnContext( '#vm-'+uuid, new VmBox( $container, uuid, os ) );
                        $('#vms-container').append($container);
                        $('#new-vm-dialog').modal('hide');
                    },
                    error:function(err){
                        if( progressBar ) progressBar.remove();
                        $container.modal('hide');
                        alert('에러'+err);
                        console.log( "insert err", err)
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
            $('#slider-cpu').val(1);
            $('#slider-ram').val(512);
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

genVmContainer = function($vm, uuid, odd){
console.log('in odd', odd);
    if( odd )
        odd = odd%2;
    else{
        odd = $('#vms-container').children().length % 2;
    }

    console.log( "odd", odd );

    if( odd ){
        var $container = $('<div id="vm-'+uuid+'" class="content-section-a"></div>');

    }else{
        var $container = $('<div id="vm-'+uuid+'" class="content-section-b"></div>');
    }
    $container.append( $vm );

    return $container;
}
rearrangeSesstionClass = function(){

}

$(document).ready( function(){

    var dialog, form;

    dialog = new VmDialog( $("#new-vm-dialog"), $('#btn-vm-add'), {
        open: function(){
        },
        close : function(){
        },
        success: function($container){
        }
    });



    function listup( objs ){
        objs.forEach( function( value, index ){

            var $section=$(
                '<div class="container">'+
                '<div class="row">'+
                    '<div class="col-lg-5 col-sm-6">'+
                        '<hr class="section-heading-spacer">'+
                            '<div class="clearfix"></div>'+
                            '<h1 class="section-heading"></h1>'+
                            '<h3 class="os"></h3>'+
                            '<br>'+
                            '<div class="row">'+
                                '<p class="col-sm-3">State</p>'+
                                '<p class="state"></p>'+
                            '</div>'+
                            '<div class="row">'+
                                '<p class="col-sm-3">CPU</p>'+
                                '<p class="vcpus"></p>'+
                            '</div>'+
                            '<div class="row">'+
                                '<p class="col-sm-3">Memory</p>'+
                                '<p class="ram"></p>'+
                            '</div>'+
                            '<div class="row">'+
                                '<p class="col-sm-3">Storage</p>'+
                                '<p class="storage"></p>'+
                            '</div>'+
                            '<p class="lead">Turn your 2D designs into high quality</p>'+
                        '</div>'+
                        '<div class="col-lg-5 col-lg-offset-2 col-sm-6 ">'+
                            '<img class="img-responsive" src="/public/img/phones.png" alt="">'+
                            '</div>'+
                        '</div>'+
                        '<div class="controll-cont">'+
                            '<button id="btn-runner" class="controller col-lg-5 col-sm-5 col-xs-5 ladda-button " data-style="slide-left" value="default"><span class="ladda-label">stop</span></button>'+
                            '<button id="btn-viewer" class="controller col-lg-offset-2 col-lg-5 col-sm-5 col-sm-offset-2 col-xs-5 col-xs-offset-2 ladda-button">view</button>'+
                        '</div>'+
                    '</div>'+
                '</div>'
            );
           var $container = genVmContainer( $section, value.uuid, index );
            //new VmBox( $container, value.uuid, value.os );
            setOnContext( '#vm-'+value.uuid, new VmBox( $container, value.uuid, value.os ) );
            $('#vms-container').append($container);
        });
    }

    function loadHostInfomation(){
        if( !memCircle )
            memCircle = $('#mem-stat').circliful();
        if( !strCircle )
            strCircle = $('#storage-stat').circliful();



        $.ajax({
            url:'/vms/storage',
            type:'get',
            datatype:'json',
            success: function( data ){
                console.log( "vm storage", data );
                var zero = data.zpools[0];
                strCircle( parseInt(zero.size), parseInt(zero.allocated), 'GB');
            },
            error:function(){
            }
        });
        $.ajax({
            url:'/vms/memory',
            type:'get',
            datatype:'json',
            success: function( data ){
                console.log( "vm memory", data );
                memCircle( data.total, data.memory, 'MB');
            },
            error:function(){

            }
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
    loadHostInfomation();
    setInterval(loadHostInfomation, 5000 );
    loadVirtualMachine();


    $("#btn-vm-add").on('click', function(){
            $("#new-vm-dialog").modal('show');
        });
    $('.dropdown-menu li a').click(function(){
        $('#dropdown-os').text( $(this).text()+' ').append( $("<span class='caret'></span>"));
        $('#dropdown-os').val( $(this).data('value') );
    });


    // When no HTML is provided, noUiSlider creates an empty <div>
    var toolTip = $.Link({
        target: '-tooltip-<div class="tool"></div>'
    });

    // Otherwise, the HTML will be inserted into the handle.
    // One level of HTML is supported.
    var customToolTip = $.Link({
        target: '<div class="tooltip"></div>',
        method: function ( value ) {

            // The tooltip HTML is 'this', so additional
            // markup can be inserted here.
            $(this).html(
                    '<strong>Value: </strong>' +
                    '<span>' + value + '</span>'
            );
        }
    });

    $("#slider-cpu").noUiSlider({
        start: 1,
        direction: "ltr",
        connect:"lower",
        step:1,
        range: {
            'min': 1,
            'max': 4
        },
        serialization: {
            lower: [ toolTip],
            //upper: [ customToolTip ]

            format:{
                decimals:0,
                postfix: ' Core'
            }
        }

    });
    var toolTip2 = $.Link({
        target: '-tooltip-<div class="tool"></div>'
    });
    $("#slider-ram").noUiSlider({
        start: 512,
        direction: "ltr",
        connect:"lower",
        step:512,
        range: {
            'min': 512,
            'max': 3072
        },
        serialization: {
            lower: [toolTip2 ],
            //upper: [ customToolTip ]
            format:{
                decimals:0,
                postfix: ' MB'
            }
        }

    });
    var toolTip3 = $.Link({
        target: '-tooltip-<div class="tool"></div>'
    });
    $("#slider-storage").noUiSlider({
        start: 8,
        direction: "ltr",
        connect:"lower",
        range: {
            'min': 8,
            'max': 100
        },
        serialization: {
            lower: [toolTip3 ],
            //upper: [ customToolTip ]
            format:{
                decimals:1,
                postfix: ' GB'
            }
        }

    });
    $('.rest').restfulizer({
        parse:true,
        method:"DELETE",
        target:"/sessions"
    });




    /*function view(){
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", "/vms/experiment");
        form.setAttribute("target", "/vms/experiment");

        var jForm = $(form);

        var input = document.createElement("input");
        input.type = "hidden";
        input.name = "uuid";
        input.value = "uuid";
        $(input).appendTo(jForm);
        //.appendChild(input);



        //alert("view!"+input.value);
        hWndHelp = window.open('', '/vms/experiment', 'width=1188, height=840, resizable= no');
        hWndHelp.focus();


        jForm.appendTo('body').submit();
        //alert("view!2"+input.value);
        try {
            // document.body.removeChild(form);
        }catch( e ){
            console.log( "removeChild", e );
        }
    }

    $('#btn-experiment').on('click', function(){
        view();
    });*/







    /*
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
        */
});
