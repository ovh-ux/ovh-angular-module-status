"use strict";

angular.module("ovh-angular-module-status")
    .config(function ($stateProvider) {
        $stateProvider.state("status.task", {
            url: "/task",
            views: {
                statusView: {
                    templateUrl: "app/module-status/task/status-task.html"
                },
                "@taskView": {
                    templateUrl: "app/module-status/task/status-task-main.view.html",
                    controller: "StatusTaskCtrl",
                    controllerAs: "StatusTask"
                }
            },
            translations: ["common", "module-status/task"]
        });
    });
