"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status-task-alert", {
            url: "/status/task/alert",
            templateUrl: "app/module-status/task/alert/status-task-alert.html",
            translations: ["common", "module-status-task-alert"]
        });
    });
