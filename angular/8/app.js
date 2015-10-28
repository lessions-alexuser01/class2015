var myApp = angular.module('myApp', []);

myApp.controller('mainController', ['$scope', '$filter', '$http', function ($scope, $filter, $http) {

    $scope.handle = '';

    $scope.lowercasehandle = function () {
        return $filter('lowercase')($scope.handle);
    };

    $scope.characters = 5;

    $http.get('//localhost:3000/rules')
        .success(function(result) {
            $scope.rules = result;
        })
        .error(function(data, status) {
            console.log(data);
        });

    $scope.newRule = '';
    $scope.addRule = function() {
        $http.post('//localhost:3000/rules', { rulename: $scope.newRule })
            .success(function (result){
                $scope.rules = result;
                $scope.newRule = '';
            })
            .error(function(data, status) {
                console.log(data, status);
            })
    }

}]);