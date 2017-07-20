angular.module("ovh-angular-module-status").service("StatusService", function (moment, $translate) {
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
});
