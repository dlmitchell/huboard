define(["text!../templates/column.html","./cardView","../../common/events/postal","../models/milestone"],function(template, CardView, postal, milestone){

  var Column = Backbone.View.extend({
    initialize : function(params) {
      this.column = params.column;
      this.repo = params.repo;
      this.user = params.user;

      this.milestone = new milestone({model: this.column.milestone, user: params.user, repo: params.repo});

       _.bind("reordered",this.reordered);

      //postal.subscribe("Moved.Socket." + params.column.index, $.proxy(this.onSocket,this));
      //postal.socket(params.user + "/" + params.repo, "Opened." + params.column.index, $.proxy(this.onOpened,this))
    },
    tagName: "div",
    className: "column",
    events: {
      "reorder":"reordered"
    },
    reordered: function(ev,data) {
       this.milestone.save(data);
    },
    onOpened: function(issue){
      var card = new CardView({issue: issue, user: this.user, repo: this.repo});
      $("ul",this.el).append(card.render().el);
      postal.publish("Opened.Issue",issue)
    },
    onSocket : function(data){
      var elements = $("li", this.el),
      index = elements.index(data.card.el);

      if(index !== -1) { return; }

      $("ul",this.el).append(data.card.el);

    },
    render: function(){
      var column = $(_.template(template, this.column)),
          self = this;


      var cards = _.map(this.column.issues, function(issue){
        var card = new CardView({issue : issue, user: self.user, repo: self.repo});
        return card.render().el;
      });

      $(this.el)
        .append(column)
        .data("milestone",this.column.milestone)
        .find("ul")
        .append(cards);

      $("ul",this.el).sortable({
         helper: 'clone',
         connectWith: ".sortable",
         placeholder: "ui-sortable-placeholder",
         receive: $.proxy(this.onReceive,this),
         remove: $.proxy(this.onRemove, this),
         over: $.proxy(this.onOver, this),
         update: $.proxy(this.onStop, this),
         out: $.proxy(this.onOut, this)
      });

      return this;
    },
    onReceive: function(ev, ui){
      $(ui.item).trigger("moved",this.column);
    },
    onRemove: function(ev, ui){
       // don't know if need yet
    },
    onOver: function(ev, ui){
       $("ul",this.el).addClass("ui-sortable-hover");
    },
    onOut: function (ev, ui){
       $("ul",this.el).removeClass("ui-sortable-hover");
    },
    onStop : function(ev,ui){
      var elements = $("li", this.el),
      index = elements.index(ui.item);

      if(index === -1) { return; }

      var first = index === 0,
      last = index === elements.size() - 1,
      currentElement = $(ui.item),
      currentData = currentElement.data("issue"),
      beforeElement = elements.get(index ? index - 1 : index),
      beforeIndex = elements.index(beforeElement),
      beforeData = $(beforeElement).data("issue"),
      afterElement = elements.get(elements.size() - 1 > index ? index + 1 : index),
      afterIndex = elements.index(afterElement),
      afterData = $(afterElement).data("issue"),
      current = currentData._data.order || currentData.number,
      before = beforeData._data.order || beforeData.number,
      after = afterData._data.order || afterData.number;

      if(first && last) {return;}
      
      if(first) {
        // dragged it to the top
        currentData._data.order = (after || 1)/2;
        currentElement
        .trigger("reorder", currentData._data.order)  
        .data("issue", currentData);  
      } else if (last) {
        // dragged to the bottom
        currentData._data.order = (before + 1);
        currentElement
        .trigger("reorder", currentData._data.order)  
        .data("issue", currentData);  
      }  else {
        currentData._data.order = (((after + before) || 1)/2);
        currentElement
        .trigger("reorder", currentData._data.order)  
        .data("issue", currentData);  
      }
    }
  });
  return Column;
});
