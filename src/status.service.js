angular.module("ovh-angular-module-status").service("StatusService", function ($q, $translate, $translatePartialLoader, moment, OvhApiStatus) {
    "use strict";

    var self = this;

    this.augmentStatus = function (task) {
        var augmentedTask = _.cloneDeep(task);
        augmentedTask.dateToShow = self.getDateToShow(task);
        return augmentedTask;
    };

    this.getDateToShow = function (task) {
        var dateToShow;
        if (task.endDate) {
            dateToShow = {
                display: moment(task.endDate).format("ll, LTS"),
                date: task.endDate,
                unix: moment(task.endDate).unix()
            };
        } else if (task.type === "maintenance") {
            dateToShow = {
                display: moment(task.startDate).format("ll, LTS"),
                date: task.startDate,
                unix: moment(task.startDate).unix()
            };
        } else if (task.type === "incident") {
            if (task.replies.length > 0) {
                var lastReplay = _.last(task.replies);
                dateToShow = {
                    display: moment(lastReplay.date).format("ll, LTS"),
                    date: lastReplay.date,
                    unix: moment(lastReplay.date).unix()
                };
            } else {
                dateToShow = {
                    display: moment(task.startDate).format("ll, LTS"),
                    date: task.startDate,
                    unix: moment(task.startDate).unix()
                };
            }
        } else {
            dateToShow = {
                display: moment().format("ll, LTS"),
                date: moment(),
                unix: moment().unix()
            };
        }
        return dateToShow;
    };

    this.getCurrentStatus = function (task) {
        return $translate.instant("status_" + task.type + "_" + task.status);
    };

    this.orderStatusNotification = function (taskList) {
        return _.sortBy(taskList, function (task) {
            return moment(task.dateToShow.date);
        }).reverse();
    };

    this.getNotificationsMenu = function () {
        $translatePartialLoader.addPart("ovh-angular-module-status");

        return $q.all({
            translate: $translate.refresh(),
            tasks: OvhApiStatus.Task().v6().query().$promise
        }).then(function (result) {
            var tasks = _.map(result.tasks, function (task) {
                task.dateToShow = self.getDateToShow(task);
                return task;
            });
            var subLinks = _.map(self.orderStatusNotification(tasks), function (task) {
                return {
                    title: task.title,
                    url: "#/status/task/" + task.uuid,
                    template:
                        '<div class="clearfix">' +
                            '<div class="notification__title">' + task.title + "</div>" +
                            '<div class="notification__date">' + task.dateToShow.display + "</div>" +
                        "</div>" +
                        '<div class="clearfix">' +
                            '<div class="notification__text">' + task.project + "</div>" +
                            '<div class="notification__status">' + self.getCurrentStatus(task) + "</div>" +
                        "</div>"
                };
            });

            return {
                name: "notifications",
                title: $translate.instant("status_menu_title"),
                iconClass: "icon-notifications",
                limitTo: 10,
                footerTitle: $translate.instant("status_menu_see_all"),
                footerUrl: "#/status/task",
                subLinks: subLinks,
                show: true
            };
        })
            .catch(function () {
                return $q.resolve({
                    show: false
                });
            });
    };
});
