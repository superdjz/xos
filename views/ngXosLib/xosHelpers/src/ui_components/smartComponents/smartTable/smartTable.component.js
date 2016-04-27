/**
 * © OpenCORD
 *
 * Visit http://guide.xosproject.org/devguide/addview/ for more information
 *
 * Created by teone on 3/24/16.
 */

(function () {
  'use strict';

  angular.module('xos.uiComponents')

    /**
    * @ngdoc directive
    * @name xos.uiComponents.directive:xosSmartTable
    * @restrict E
    * @description The xos-table directive
    * @param {Object} config The configuration for the component.
    * @scope
    * @example
    */
   
  .directive('xosSmartTable', function(){
    return {
      restrict: 'E',
      scope: {
        config: '='
      },
      template: `
        <div class="row" ng-show="vm.data.length > 0">
          <div class="col-xs-12 text-right">
            <a href="" class="btn btn-success" ng-click="vm.createItem()">
              Add
            </a>
          </div>
        </div>
        <div class="row">
          <div class="col-xs-12 table-responsive">
            <xos-table config="vm.tableConfig" data="vm.data"></xos-table>
          </div>
        </div>
        <div class="panel panel-default" ng-show="vm.detailedItem">
          <div class="panel-heading">
            <div class="row">
              <div class="col-xs-11">
                <h3 class="panel-title" ng-show="vm.detailedItem.id">Update {{vm.config.resource}} {{vm.detailedItem.id}}</h3>
                <h3 class="panel-title" ng-show="!vm.detailedItem.id">Create {{vm.config.resource}} item</h3>
              </div>
              <div class="col-xs-1">
                <a href="" ng-click="vm.cleanForm()">
                  <i class="glyphicon glyphicon-remove pull-right"></i>
                </a>
              </div>
            </div>
          </div>
          <div class="panel-body">
            <xos-form config="vm.formConfig" ng-model="vm.detailedItem"></xos-form>
          </div>
        </div>
        <xos-alert config="{type: 'success', closeBtn: true}" show="vm.responseMsg">{{vm.responseMsg}}</xos-alert>
        <xos-alert config="{type: 'danger', closeBtn: true}" show="vm.responseErr">{{vm.responseErr}}</xos-alert>
      `,
      bindToController: true,
      controllerAs: 'vm',
      controller: function($injector, LabelFormatter, _, XosFormHelpers){
        
        // NOTE
        // Corner case
        // - if response is empty, how can we generate a form ?

        this.responseMsg = false;
        this.responseErr = false;

        this.tableConfig = {
          columns: [
          ],
          actions: [
            {
              label: 'delete',
              icon: 'remove',
              cb: (item) => {
                this.Resource.delete({id: item.id}).$promise
                .then(() => {
                  this.responseMsg = `${this.config.resource} with id ${item.id} successfully deleted`;
                })
                .catch(err => {
                  this.responseErr = err.data.detail || `Error while deleting ${this.config.resource} with id ${item.id}`;
                });
              },
              color: 'red'
            },
            {
              label: 'details',
              icon: 'search',
              cb: (item) => {
                this.detailedItem = item;
              }
            }
          ],
          classes: 'table table-striped table-bordered table-responsive',
          filter: 'field',
          order: true,
          pagination: {
            pageSize: 10
          }
        };

        this.formConfig = {
          exclude: this.config.hiddenFields,
          fields: [],
          formName: `${this.config.resource}Form`,
          actions: [
            {
              label: 'Save',
              icon: 'ok',
              cb: (item) => {
                item.$save()
                .then(() => {
                  this.responseMsg = `${this.config.resource} with id ${item.id} successfully saved`;
                })
                .catch((err) => {
                  this.responseErr = err.data.detail || `Error while saving ${this.config.resource} with id ${item.id}`;
                })
              },
              class: 'success'
            }
          ]
        };

        this.cleanForm = () => {
          delete this.detailedItem;
        };

        this.createItem = () => {
          this.detailedItem = new this.Resource();
        };

        this.Resource = $injector.get(this.config.resource);

        this.Resource.query().$promise
        .then((res) => {

          if(!res[0]){
            return;
          }

          let item = res[0];
          let props = Object.keys(item);

          _.remove(props, p => {
            return p == 'id' || p == 'password' || p == 'validators'
          });

          // TODO move out cb
          if(angular.isArray(this.config.hiddenFields)){
            props = _.difference(props, this.config.hiddenFields)
          }

          let labels = props.map(p => LabelFormatter.format(p));

          props.forEach((p, i) => {
            this.tableConfig.columns.push({
              label: labels[i],
              prop: p
            });
          });

          // build form structure
          props.forEach((p, i) => {
            this.formConfig.fields.push({
              label: LabelFormatter.format(labels[i]).replace(':', ''),
              type: XosFormHelpers._getFieldFormat(item[p])
            });
          });

          this.data = res;
        });
      }
    };
  });
})();