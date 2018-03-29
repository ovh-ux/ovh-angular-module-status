angular.module("ovh-angular-module-status", [
    "ovh-api-services"
]);

"use strict";

angular.module("ovh-angular-module-status").config(["$stateProvider", function ($stateProvider) {
    $stateProvider.state("status", {
        url: "/status",
        templateUrl: "app/module-status/status.html",
        "abstract": true
    });
}]);

angular.module("ovh-angular-module-status").service("StatusService", ["$q", "$translate", "$translatePartialLoader", "moment", "OvhApiStatus", function ($q, $translate, $translatePartialLoader, moment, OvhApiStatus) {
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

            var headerTemplate =
                '<h2 class="oui-navbar-menu__title">' + $translate.instant("status_menu_beta_title") + "</h2>" +
                '<p class="notification__intro">' + $translate.instant("status_intro") + "</p>" +
                '<a class="notification__email" href="mailto:feedbackstatus@corp.ovh.com">feedbackstatus@corp.ovh.com</a>';

            return {
                name: "notifications",
                title: $translate.instant("status_menu_title"),
                iconClass: "icon-notifications",
                limitTo: 10,
                headerTemplate: headerTemplate,
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
}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status-task-alert", {
            url: "/status/task/alert",
            templateUrl: "app/module-status/task/alert/status-task-alert.html",
            translations: ["common", "module-status-task-alert"]
        });
    }]);

angular.module("ovh-angular-module-status").controller("StatusTaskDetailCtrl", ["OvhApiStatus", "Toast", "$stateParams", "$translate", function (OvhApiStatus, Toast, $stateParams, $translate) {
    var self = this;


    this.loading = {
        init: true
    };

    this.currentTaskId = $stateParams.uuid;
    this.task = null;

    function init () {
        self.loading.init = true;

        return OvhApiStatus.Task().v6().query().$promise.then(function (tasks) {
            self.task = _.find(tasks, function (task) {
                return task.uuid === self.currentTaskId;
            });
            return self.task;
        }, function (error) {
            return Toast.error([$translate.instant("status_task_detail_init_error"), error.data.message].join(" "));
        }).finally(function () {
            self.loading.init = false;
        });
    }

    init();

}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status.task.detail", {
            url: "/{uuid}",
            views: {
                "headerStatusView@status": {
                    templateUrl: "app/module-status/task/detail/status-detail-header.html"
                },
                "mainStatusView@status": {
                    templateUrl: "app/module-status/task/detail/status-task-detail.html",
                    controller: "StatusTaskDetailCtrl",
                    controllerAs: "TaskDetail"
                }
            },
            translations: ["common", "module-status/task/detail"]
        });
    }]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
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
    }]);

angular.module("ovh-angular-module-status").controller("StatusTaskCtrl", ["$state", "OvhApiStatus", "StatusService", "Toast", "$translate", function ($state, OvhApiStatus, StatusService, Toast, $translate) {
    var self = this;

    this.tasks = undefined;

    self.getTasks = function () {
        return OvhApiStatus.Task().v6().query().$promise.then(function (tasks) {
            self.tasks = _.map(tasks, StatusService.augmentStatus);
            self.tasks = StatusService.orderStatusNotification(self.tasks);
            return {
                data: self.tasks,
                meta: {
                    totalCount: self.tasks.length
                }
            };
        }).catch(function (error) {
            return Toast.error([$translate.instant("status_tasks_init_error"), error.data.message].join(" "));
        });
    };

    self.goSeeDetails = function (uuid) {
        $state.go("status.task.detail", { uuid: uuid });
    };

}]);

"use strict";

angular.module("ovh-angular-module-status")
    .config(["$stateProvider", function ($stateProvider) {
        $stateProvider.state("status.task", {
            url: "/task",
            redirectTo: "status.task.list",
            translations: ["common", "module-status/task"]
        });
    }]);

angular.module('ovh-angular-module-status').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('app/module-status/status.html',
    "<section><div data-ui-view=headerStatusView></div><main class=status-task-section-content role=main data-ui-view=mainStatusView></main></section>"
  );


  $templateCache.put('app/module-status/task/alert/status-task-alert.html',
    "<section class=header-section><header class=header-container role=banner><h1 translate=status_menu_title></h1><a class=section-back-link data-ui-sref=status-task><span><i class=\"ovh-font ovh-font-arrow-left\" aria-hidden=\"\"></i> <span data-translate=\"\">Retour à la liste</span></span></a></header></section><section><h2>SOON</h2></section>"
  );


  $templateCache.put('app/module-status/task/detail/status-detail-header.html',
    "<div class=status-section-header><header role=banner><h1 class=oui-header_1 translate=status_menu_title></h1><a class=section-back-link href=\"\" data-ui-sref=status.task><span><i class=\"ovh-font ovh-font-arrow-left\" aria-hidden=true></i> <span data-translate=status_task_detail_back></span></span></a></header></div>"
  );


  $templateCache.put('app/module-status/task/detail/status-task-detail.html',
    "<section data-ng-if=TaskDetail.loading.init class=text-center><spinner name=bubbles-222-fff-32></spinner><p data-translate=status_task_detail_loading_task></p></section><section data-ng-if=\"!TaskDetail.loading.init && TaskDetail.task\"><div class=\"row bottom-space-m16\"><div class=col-xs-12><h2 data-ng-bind=::TaskDetail.task.title></h2></div></div><div class=\"row bottom-space-m16\"><div class=\"col-xs-8 col-lg-5\"><h4><span data-ng-bind=\"('status_tasks_list_type_label_' + TaskDetail.task.type) | translate\"></span> - <span data-ng-bind=TaskDetail.task.project></span></h4></div><div class=\"col-xs-4 col-lg-7\"><dl class=\"dl-horizontal status-task-dl\"><dt data-translate=status_task_detail_id_label></dt><dd data-ng-bind=TaskDetail.task.reference></dd></dl></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-4><p class=\"label status-task__label status-task__label_normal\" data-ng-bind=\"('status_tasks_list_status_label_' + TaskDetail.task.status) | translate\"></p><p class=\"label status-task__label\" data-ng-class=\"{\n" +
    "                'status-task__label_major': TaskDetail.task.impact === 'downtime' || TaskDetail.task.impact === 'fullUnavailability',\n" +
    "                'status-task__label_warning': TaskDetail.task.impact === 'partialUnavailability',\n" +
    "                'status-task__label_minor': TaskDetail.task.impact === 'none' || TaskDetail.task.impact === 'unknown'\n" +
    "            }\" data-ng-bind=\"('status_tasks_list_impact_label_' + TaskDetail.task.impact) | translate\"></p></div></div><div class=\"row bottom-space-m16\"><div class=\"col-xs-6 text-left\"><dl class=\"dl-horizontal status-task-dl\"><dt><span class=\"glyphicon glyphicon-time\"></span> <span data-translate=status_tasks_detail_start></span></dt><dd data-ng-bind=\"TaskDetail.task.startDate | date:'medium'\"></dd><dt data-ng-if=TaskDetail.task.endDate><span class=\"glyphicon glyphicon-time\"></span> <span data-translate=status_tasks_detail_end></span></dt><dd data-ng-if=TaskDetail.task.endDate data-ng-bind=\"TaskDetail.task.endDate | date:'medium'\"></dd></dl></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><p data-ng-bind=TaskDetail.task.details></p></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><h3 data-translate=status_task_detail_impacted_title></h3></div><div class=col-xs-12><p data-ng-bind=TaskDetail.task.impactedService></p></div></div><div class=\"row bottom-space-m16\"><div class=col-xs-12><h3 data-translate=status_task_detail_reply_title></h3></div><div class=col-xs-12><div class=row data-ng-if=TaskDetail.task.replies.length data-ng-repeat=\"reply in TaskDetail.task.replies\"><div class=\"col-xs-12 col-md-8 col-lg-5 status-task-detail-reply\"><p data-ng-bind=reply.comment></p><small class=text-muted data-ng-bind=\"reply.date | date:'medium'\"></small></div></div><div class=row data-ng-if=!TaskDetail.task.replies.length><div class=\"col-xs-12 col-md-8 col-lg-5 status-task-detail-reply text-center\"><p data-translate=status_task_detail_no_reply></p></div></div></div></div></section>"
  );


  $templateCache.put('app/module-status/task/list/status-header.html',
    "<div class=status-section-header><header role=banner><h1 class=oui-header_1 translate=status_menu_title></h1></header><nav role=navigation><responsive-tabs><responsive-tab data-state=\"{{ ::'status.task' }}\" dropdown-title=\"{{'status_tasks_list_title'|translate}}\"><span data-translate=status_tasks_list_title></span></responsive-tab><responsive-tab-more><i class=\"fa fa-plus\"></i></responsive-tab-more></responsive-tabs></nav></div>"
  );


  $templateCache.put('app/module-status/task/list/status-task.html',
    "<section><oui-datagrid data-rows-loader=StatusTask.getTasks()><oui-column data-title=\"'status_tasks_list_title_title' | translate\" data-property=project data-sortable>{{ \"status_tasks_list_product_label_\" + $row.project | translate }}</oui-column><oui-column data-title=\"'status_tasks_list_type_title' | translate\" data-property=type data-sortable=desc>{{ \"status_tasks_list_type_label_\" + $row.type | translate }}</oui-column><oui-column data-title=\"'status_tasks_list_state_title' | translate\" data-property=status data-sortable=desc>{{ \"status_tasks_list_status_label_\" + $row.status | translate }}</oui-column><oui-column data-title=\"'status_tasks_list_date_title' | translate\" data-property=dateToShow.display data-sortable></oui-column><oui-column data-title=\"'status_tasks_list_details_title' | translate\" data-property=title data-sortable></oui-column><oui-action-menu data-align=end data-compact><oui-action-menu-item data-text=\"{{'status_tasks_list_see_more' | translate}}\" data-on-click=StatusTask.goSeeDetails($row.uuid)></oui-action-menu-item></oui-action-menu></oui-datagrid></section>"
  );

}]);
