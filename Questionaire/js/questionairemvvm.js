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
    this.identifier = identifier;
    this.category = category;
    this.text = text;
    this.agreed = agreed;
};

// Manager
function QuestionManager()
  {
    // This thing is responsible for storing the various alarms
    // We need to be able to add an alarm, delete an alarm, toggle the state of an alarm
    // Give a list of alarms
    // Repeat array is ordered monday to sunday
    this.questionList = ([new Question(1, "A", "Our team lacks leadership.", false),
                          new Question(2, "B", "Decisions seem to be forced upon us.", false)]);
    
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
          this.questionList[index].agreed = false;  
       }
    }
    this.toggleAgreed = function(id, agreed) {
      var found = false;
        
      for (var index = 0; (index < this.questionList.length && found == false); ++index) {
        if (id == this.questionList[index].identifier)
          {
          
          if (this.questionList[index].agreed != agreed)
            {
            this.questionList[index].agreed = agreed;
            // Now update the score for the appropriate category...
            this.updateScore(this.questionList[index].category, agreed);
            }
          found = true;
          }
        }    
      };
    
    this.getQuestion = function(id)
      {
      for (var index = 0; (index < this.questionList.length); ++index) {
        if (id == this.questionList[index].identifier)
          {
          return this.questionList[index];
          }
        } 
      };
  };

// View Models
function QuestionViewModel() {
    // Properties
    this.template = "questions";
    this.id = ko.observable(1);
    this.statement = ko.observable("");
    this.agreed = ko.observable(false);
    this.questionNo = ko.computed(function() {
        return "Question " + this.id() + " of " + questionManager.questionList.length;
    }, this);
       
    // Interface
    this.loadNewQuestion = function(getNextNotPrevious) {
      // Get the next question from the question manager & assign stuff
      var nextId = this.id();
      if (getNextNotPrevious)
        {
        nextId++;   
        }
      else
        {
        nextId--;   
        }
      
      this.id(nextId);
      var newQuestion = questionManager.getQuestion(this.id());
      this.statement(newQuestion.text);
      this.agreed(newQuestion.agreed);
      };
    
   
    this.initialise = function() {
        this.id(0)
        this.loadNewQuestion(true);
    };
    
    this.uiAgreeToggle = function() {
     var tempAgreed = this.agreed();
     this.agreed(tempAgreed==false);
    }
    this.nextPressed = function() {
      // Toggle the agreed so that the manager is update...
      questionManager.toggleAgreed(this.id(), this.agreed());
        
      // Are there more questions?
      if (this.id() < questionManager.questionList.length)
        {
        // If so, load it / update state of the question...
        this.loadNewQuestion(true);
        }
      else
        {
        // Otherwise display the results
        resultsViewModel.refresh();
        $.mobile.changePage("#" + resultsViewModel.template);
        }
    };
    
    this.previousPressed = function() {
      // Toggle the agreed so that the manager is update...
      questionManager.toggleAgreed(this.id, this.agreed());
        
      // Is there an earlier question?
      if (this.id() > 1)
        {
        // If so, load it / update current state...
        this.loadNewQuestion(false);
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