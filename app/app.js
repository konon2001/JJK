var app = angular.module('myApp', ['ngRoute']);

//This configures the routes and associates each route with a view and a controller
app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
        .when('/',
            {
                controller: 'ToolController',
                templateUrl: 'app/partials/main.html'
            })
        .otherwise({ redirectTo: '/' });
}]);
