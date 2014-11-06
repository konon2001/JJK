/**
 * Created by shinsungho on 14. 10. 25..
 */
app.directive('mainView', ['$route', '$anchorScroll', '$compile', '$controller', function ($route, $anchorScroll, $compile, $controller) {
    return {
        restrict : 'ECA',
        replace : true,
        templateUrl : 'app/partials/editor.html',
        link: function (scope, element, attr) {

        }
    };
}]);
