/**
 * Created by shinsungho on 2014. 9. 18..
 */
app.service('toolService', function () {

});

app.factory('server', ['$http', function ($http) {
    var SERVER = "http://localhost:9090";


    return {
        get: function(url) {
            return $http.get(SERVER+url);
        },
        post: function(url, params) {
            return $http.post(SERVER+url, params);
        },
        put : function(url, params){
            return $http.put(SERVER+url, params);
        }
    };
}]);