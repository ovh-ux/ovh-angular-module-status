"use strict";

angular.module("ovh-angular-module-status").config(function ($stateProvider) {
    $stateProvider.state("status", {
        url: "/status",
        templateUrl: "app/module-status/status.html",
        "abstract": true
    });
}).run(function (managerNavbar, StatusService, OvhApiStatus, $translate, $translatePartialLoader, $q) {

    $translatePartialLoader.addPart("ovh-angular-module-status");

    $q.all([
        $translate.refresh(),
        OvhApiStatus.Task().Lexi().query()
    ]).then(function (responses) {
        return responses[1].$promise || $q.when([]);
    }).then(function (_tasks) {
        var subLinks = [];

        var tasks = _.map(_tasks, function (task) {
            task.dateToShow = StatusService.getDateToShow(task);
            return task;
        });

        tasks = StatusService.orderStatusNotification(tasks);

        var i = 0;
        _.forEach(tasks, function (task) {
            if (i >= 10) {
                // false to leave loop
                return false;
            }
            var status = StatusService.getCurrentStatus(task);
            subLinks.push({
                label: task.title,
                url: "#/status/task/" + task.uuid,
                template:
                    '<div class="navbar-notification__body row">' +
                        '<div class="navbar-notification__title col-md-6">' +
                            "<span>" + task.project + "</span>" +
                        "</div>" +
                        '<div class="col-md-6">' +
                            '<div class="navbar-notification__date"><span>' + task.dateToShow.display + "</span></div>" +
                            '<div class="navbar-notification__status"><span>' + status + "</span></div>" +
                        "</div>" +
                    "</div>"
            });
            i++;
            return true;
        });

        var headerTemplate =
            '<div class="navbar-notification-beta__box">' +
                '<h2 class="navbar-notification-beta__title">' + $translate.instant("status_menu_beta_title") + "</h2>" +
                '<p class="navbar-notification-beta__text">' + $translate.instant("status_intro") + "</p>" +
                '<p class="navbar-notification-beta__email">feedbackstatus@corp.ovh.com</p>' +
            "</div>";

        var footerTemplate = "";
        if (subLinks.length === 0) {
            footerTemplate =
            '<div class="navbar-notification__footer navbar-notification__footer_empty">' +
                $translate.instant("status_menu_none") +
            "</div>";

        } else {
            footerTemplate =
                '<div class="navbar-notification__footer">' +
                    '<a class="navbar-notification__button" href="#/status/task">' +
                        $translate.instant("status_menu_see_all") +
                    "</a>" +
                "</div>";
        }

        managerNavbar.internalLinks.unshift({
            listClass: "navbar-notification__list",
            label: $translate.instant("status_menu_title"),
            icon: "navbar-notification__icon",
            subLinks: subLinks,
            headerTemplate: headerTemplate,
            footerTemplate: footerTemplate
        });
    });
});
