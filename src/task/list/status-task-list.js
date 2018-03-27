"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status.task.list", {
            url: "/",
            views: {
                "headerStatusView@status": {
                    templateUrl: "app/module-status/task/list/status-header.html"
                },
                "mainStatusView@status": {
                    templateUrl: "app/module-status/task/list/status-task.html",
                    controller: "StatusTaskCtrl",
                    controllerAs: "StatusTask"
                }
            },
            translations: ["common", "module-status/task"]
        });
    });
