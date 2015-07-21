'use strict';

var TestHelper = require('../../../TestHelper');

/* global bootstrapModeler, inject */


var modelingModule = require('../../../../lib/features/modeling'),
    coreModule = require('../../../../lib/core');


describe('features/modeling - attach shape', function() {

  var diagramXML = require('../../../fixtures/bpmn/boundary-events.bpmn');

  var testModules = [ coreModule, modelingModule ];

  beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


  var subProcessElement, subProcess, task, boundaryEventElement, boundaryEvent;

  beforeEach(inject(function(elementFactory, elementRegistry, canvas, modeling) {
    task = elementRegistry.get('Task_1');

    subProcessElement = elementRegistry.get('SubProcess_1');

    subProcess = subProcessElement.businessObject;

    boundaryEventElement = elementFactory.createShape({
      type: 'bpmn:BoundaryEvent',
      host: task,
      x: 513, y: 254
    });

    boundaryEvent = boundaryEventElement.businessObject;

    canvas.addShape(boundaryEventElement, subProcessElement);
  }));


  describe('shape', function() {

    it('should reattach', inject(function(modeling, elementRegistry) {

      // when
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // then
      expect(boundaryEvent.attachedToRef).to.equal(subProcess);

      expect(boundaryEvent.cancelActivity).to.equal(true);

      expect(subProcessElement.attachers).to.include(boundaryEventElement);
      expect(task.attachers).not.to.include(boundaryEventElement);
    }));


    it('should undo', inject(function(elementRegistry, commandStack, modeling) {

      // given
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // when
      commandStack.undo();

      // then
      expect(boundaryEvent.attachedToRef).to.equal(task.businessObject);
      expect(boundaryEvent.cancelActivity).to.equal(true);

      expect(subProcessElement.attachers).not.to.include(boundaryEventElement);
      expect(task.attachers).to.include(boundaryEventElement);
    }));


    it('should redo', inject(function(elementRegistry, commandStack, modeling) {

      // given
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // when
      commandStack.undo();

      commandStack.redo();

      // then
      expect(boundaryEvent.attachedToRef).to.equal(subProcess);
      expect(boundaryEvent.cancelActivity).to.equal(true);

      expect(subProcessElement.attachers).to.include(boundaryEventElement);
      expect(task.attachers).not.to.include(boundaryEventElement);
    }));

  });


  describe('rules', function() {

    it('should attach new IntermediateThrowEvent to Task', inject(function(elementFactory, bpmnRules) {
      var eventShape = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 254
      });

      expect(bpmnRules.canAttach([ eventShape ], task)).to.equal('attach');
    }));


    it('should attach new IntermediateThrowEvent to SubProcess border', inject(function(elementFactory, bpmnRules) {
      var eventShape = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 350
      });

      var position = {
        x: eventShape.x,
        y: eventShape.y
      };

      expect(bpmnRules.canAttach([ eventShape ], subProcessElement, position)).to.equal('attach');
    }));


    it('should not attach new IntermediateThrowEvent to SubProcess inner', inject(function(elementFactory, bpmnRules) {

      var eventShape = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 250
      });

      var position = {
        x: eventShape.x,
        y: eventShape.y
      };

      expect(bpmnRules.canAttach([ eventShape ], subProcessElement, position)).to.equal(false);
    }));

  });

});
