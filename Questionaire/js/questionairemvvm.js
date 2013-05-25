ko.bindingHandlers.jqmChecked = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            ko.bindingHandlers.checked.init(element, valueAccessor, allBindingsAccessor, viewModel);
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            ko.bindingHandlers.checked.update(element, valueAccessor, allBindingsAccessor, viewModel);
 
    
            var checkbox = $(element).parents()
                                     .andSelf()
                                     .filter("input[type='checkbox']");

            if (checkbox) {
              try {
                $(checkbox).checkboxradio('refresh');
                } catch (e) {
                  }
              }
        
    }
};


// Custom bindings
ko.virtualElements.allowedBindings.jqmforeach = true;
ko.bindingHandlers.jqmforeach = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        return ko.bindingHandlers['foreach']['init'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        var output = ko.bindingHandlers['foreach']['update'](element, valueAccessor, allBindingsAccessor, viewModel, bindingContext);
        
        // locate the listview
        var listview = $(element).children()
                                 .andSelf()
                                 .filter("[data-role='listview']");
 
        if (listview) {
           try {
               $(listview).listview('refresh');
               } catch (e) {
                 }
        }
        
        var checkbox = $(element).children()
                                 .andSelf()
                                 .filter("input[type='checkbox']");
 
        if (checkbox) {
           try {
               $(checkbox).checkboxradio('refresh');
               } catch (e) {
                 }
        }
        return output;
    }
};

ko.bindingHandlers.rowcolour = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
       $(element).children().andSelf().addClass("badCategory");
    },

    update: function (element, valueAccessor, allBindingsAccessor, viewModel) {
       $(element).children().andSelf().addClass("badCategory");
    }
};

function Category(letter, name, score) {
    this.letter = letter;
    this.name = name;
    this.score = ko.observable(score);
};

function Question(identifier, category, text, agreed) {
    var self = this;
    this.identifier = identifier;
    this.category = category;
    this.statement = ko.observable(text);
    this.agreed = ko.observable(agreed);
    this.uiAgreeToggle = function() {
     // First change the observable, then update the score
     self.agreed(!self.agreed());
     questionManager.updateScore(self.category, self.agreed());
    }
};

// Manager
function QuestionManager()
  {
    // This thing is responsible for storing the various alarms
    // We need to be able to add an alarm, delete an alarm, toggle the state of an alarm
    // Give a list of alarms
    // Repeat array is ordered monday to sunday
    this.questionList = ([new Question(1, "A", "Our team lacks leadership.", false),
                          new Question(2, "B", "Decisions seem to be forced upon us.", false),
                          new Question(3, "B", "This is a third statement.", false)]);
    
    this.categoryList = ([new Category("A", "Balanced roles", 0),
                          new Category("B", "Clear objectives and agreed goals", 0),
                          new Category("C", "Openness and confrontation", 0),
                          new Category("D", "Support and trust", 0),
                          new Category("E", "Co-operation and conflict", 0),
                          new Category("F", "Sound procedures", 0),
                          new Category("G", "Appropriate leadership", 0),
                          new Category("H", "Regular review", 0),
                          new Category("I", "Individual development", 0),
                          new Category("J", "Sound intergroup relations", 0),
                          new Category("K", "Good communications", 0),
                          new Category("L", "Organisational support", 0)]);
     
    this.questionsPerPage = 2;
      
    this.getCategoryList = function() {
      return this.categoryList;
      };
    
    this.getSortedCategories = function () {
      return this.categoryList.sort(function(a,b) { return b.score() - a.score(); })
      }
    
    // Updates a score for a particular category
    this.updateScore = function(category, agreed) {
      
      for (var index = 0; index < this.categoryList.length; ++index) {
        if (category == this.categoryList[index].letter)
          {
          var newScore = this.categoryList[index].score();
          
          if (agreed)
            {
            newScore++;
            }
          else
            {
            if (newScore > 0)
              {
              newScore--;
              };
            }
              
          this.categoryList[index].score(newScore);
          break;
          }
        }    
      };
    
    this.resetState = function()
    {
       for (var index = 0; index < this.categoryList.length; ++index) {             
          this.categoryList[index].score(0);  
       }
       
       for (var index = 0; index < this.questionList.length; ++index) {             
          this.questionList[index].agreed(false);  
       }
    }
    
    this.getQuestionSet = function(id)
      {
      var questionStart = id * this.questionsPerPage;
      var questionEnd   = (id+1) * this.questionsPerPage;
      return this. questionList.slice(questionStart, questionEnd);
      };
  };

// View Models
function QuestionViewModel() {
    // Properties
    this.template = "questions";
    this.questions = ko.observableArray();
    this.pageId = ko.observable(1);
    this.pageHeader = ko.computed(function() {
        var numberOfPages = Math.ceil(questionManager.questionList.length / questionManager.questionsPerPage);
        var displayId = this.pageId() + 1;
        return "Page " + displayId + " of " 
               + numberOfPages;
    }, this);
       
    // Interface
    this.loadNewQuestions = function(getNextNotPrevious) {
      // Get the next question from the question manager & assign stuff
      var nextId = this.pageId();
      if (getNextNotPrevious)
        {
        nextId++;   
        }
      else
        {
        nextId--;   
        }
      
      this.pageId(nextId);
      this.questions(questionManager.getQuestionSet(nextId));
      };
    
   
    this.initialise = function() {
        
        this.pageId(-1)
        this.loadNewQuestions(true);
        try {
          $( "#questions").page( "destroy" ).page(); 
        }
        catch (e)
        {
        }
    };
    
    this.nextPressed = function() {       
      // Are there more questions?
      var numberOfPages = Math.ceil(questionManager.questionList.length / questionManager.questionsPerPage) ;
      if (this.pageId() < numberOfPages - 1)
        {
        // If so, load it / update state of the question...
        this.loadNewQuestions(true);
        $( "#questions").page( "destroy" ).page(); 
        }
      else
        {
        // Otherwise display the results
        resultsViewModel.refresh();
        $.mobile.changePage("#" + resultsViewModel.template);
        }
    };
    
    this.previousPressed = function() {       
      // Is there an earlier question?
      if (this.pageId() > 0)
        {
        // If so, load it / update current state...
        this.loadNewQuestions(false);
        $( "#questions").page( "destroy" ).page(); 
        }
      else
        {
        // Otherwise display the home page
        $.mobile.changePage("#home");
        }
    };
};

function ResultsViewModel() {
  // This is the view model for the results page
  // It is responsible for getting the list of alarms from the alarm manager
  this.template = "results";
  this.categories = ko.observableArray(questionManager.getSortedCategories());
  
  this.refresh = function () {
    // Get a list from the alarm manager, assign it to the observable array
    this.categories(questionManager.getSortedCategories());
  };
  
  this.numberOfReds = 1;
  this.isBadCategory = function(categoryLetter) {
   return this.isCategoryInRange(0, this.numberOfReds, categoryLetter);
  }

  this.numberOfOranges = 1;
  this.isMediumCategory = function(categoryLetter) {
   return this.isCategoryInRange(this.numberOfReds, this.numberOfOranges + this.numberOfReds, categoryLetter);
  }

  this.isGoodCategory = function(categoryLetter) {
   return this.isCategoryInRange(this.numberOfOranges + this.numberOfReds, this.categories().length, categoryLetter);
  }
  
  this.isCategoryInRange = function(start, end, categoryLetter)
  {
  var returnValue = false;
   
   for (var index = start; index < end; ++index) {             
     if (this.categories()[index].letter == categoryLetter)
     {
     returnValue = true;
     break;
     }
   }
      
   return returnValue;   
  }
  this.homePressed = function() {
    // Reset the score and change the page
    $.mobile.changePage("#home");
    questionManager.resetState();
   }
};

function startQuestionaire()
{
questionViewModel.initialise();       
};

// create the various view models
var questionManager = new QuestionManager();
var questionViewModel = new QuestionViewModel();
var resultsViewModel = new ResultsViewModel();

// Bind them
$(document).ready(function () {
  // Hack to stop buttons from being displayed blue when highlighted
  $.mobile.activeBtnClass = 'unused';
  
  // bind each view model to a jQueryMobile page
  ko.applyBindings(questionViewModel, document.getElementById("questions"));
  ko.applyBindings(resultsViewModel, document.getElementById("results"));
});