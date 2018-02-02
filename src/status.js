"use strict";

angular.module("ovh-angular-module-status").config(function ($stateProvider) {
    $stateProvider.state("status", {
        url: "/status",
        templateUrl: "app/module-status/status.html",
        "abstract": true
    });
});
