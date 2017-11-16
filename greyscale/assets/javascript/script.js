// Initialize Firebase
// ====================================================================================
var config = {
 	// Train scheduler config
 	apiKey: "AIzaSyDnVwcgFzSZpuLFwJpC_076O7jkuvu5Zzo",
	authDomain: "wk-7-hw-train-scheduler.firebaseapp.com",
	databaseURL: "https://wk-7-hw-train-scheduler.firebaseio.com",
	projectId: "wk-7-hw-train-scheduler",
	storageBucket: "wk-7-hw-train-scheduler.appspot.com",
	messagingSenderId: "87589256783"
};
firebase.initializeApp(config);


// GLOBAL VARIABLES
// ====================================================================================
var database = firebase.database();
var trainName = "";
var destination = "";
var firstTime = "";
var frequency = 0;
var nextArrival = 0;
var minutesAway = 0;


// FUNCTIONS
// ====================================================================================
// function to convert military time to civilian time via moment.js
function civilianTime(time) {
	return moment(time, "HH:mm").format("hh:mm A");
}

// function to calculate minutes away
function calcMinAway() {

	// 1) grab first time train arrives
	firstTime = $("#time-input").val();

	// 2) grab frequency of train
	frequency = $("#frequency-input").val();

	// 3) grab current time
	var currentTime = moment();

	// First Time (pushed back 1 year to make sure it comes before current time)
	var firstTimePushed = moment(firstTime, "hh:mm").subtract(1, "years");

	// 4) current time - first time to get how many minutes have passed
	var minutesPassed = currentTime.diff(moment(firstTimePushed), "minutes");

	// 5) divide minutes passed by frequency to get remainder
	var remainder = minutesPassed % frequency;

	// 6) frequency - remainder = minutes till arrival
	return frequency - remainder;

}


// function to calculate next arrival
function calcNextArrival() {

	// get minutes till arrival
	var minutesTillArrival = calcMinAway();

	// 7) minutes till arrival + current time = arrival time
	return moment().add(minutesTillArrival, "minutes").format("hh:mm A");

}

// function to initialize page
function initPage(snapshotObject) {

	// if there are train times stored in database when page loads
	if (snapshotObject.numChildren() >= 1) {

		// for each train object
		snapshotObject.forEach(function(childSnapshot) {

			// make an array for the value of each property in the object
			var trainArray = [
				childSnapshot.child("name").val(), 
				childSnapshot.child("destination").val(), 
				childSnapshot.child("frequency").val(), 
				childSnapshot.child("nextArrival").val(), 
				childSnapshot.child("minutesAway").val()
			];

			// display to page (append to table)
			displayNewRow(trainArray);

		});

		// display message on DOM signaling no trains have been added today
		$("tbody").append("<tr id='load-message'><td colspan='5' align='center'>----------Use the form below to add a train----------</td></tr>");

	} else { 

		// display message on DOM signaling no trains running
		$("tbody").append("<tr id='load-message'><td colspan='5' align='center'>----------No trains are currently running----------</td></tr>");
	}

}

// function to render new row on DOM from train data
function displayNewRow(array) {

	// remove the initial load message that displays if there are no trains in the database on page load
	$("#load-message").remove();

	// dynamically create a virtual table row
	var tableRow = $("<tr>");

	// for each item in the array
	for (var i = 0; i < array.length; i++) {

		// append its table data to the virtual row
		tableRow.append("<td>" + array[i] + "</td>");

	}

	// append the row to the DOM
	$("tbody").append(tableRow);

}
	
// function for when user clicks submit
function renderInput() {
	
	// capture all of the input values
	trainName = $("#name-input").val();
	destination = $("#destination-input").val();
	firstTime = $("#time-input").val();
	frequency = $("#frequency").val();
	minutesAway = calcMinAway();
	nextArrival = calcNextArrival();

	// moment-ify time input to civilian time
	var firstTimeConverted = civilianTime(firstTime);

	// make object to be pushed to database
	var pushObject = {
		name: trainName,
		destination: destination,
		firstTime: firstTimeConverted,
		frequency: frequency,
		nextArrival: nextArrival,
		minutesAway: minutesAway,
		dateAdded: firebase.database.ServerValue.TIMESTAMP
	}

	// push object to database
	database.ref().push(pushObject);

	// display new info to DOM
	// 1) make array that will be used as parameter by displayNewRow()
	var trainArray = [trainName, destination, frequency, nextArrival, minutesAway];

	// 2) use array to render new row on DOM
	displayNewRow(trainArray);

	// clear out form

}


// MAIN PROCESS
// ====================================================================================
// whenever there is a change made to the page (including window load)
database.ref().once("value", function(snapshot) {

	// initialize train schedule
	initPage(snapshot);

// error handling
}, function(err) {
	console.error(err);
});

// only console out most recent object from firebase
database.ref().orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot) {

	// console insight
	console.log(snapshot.val());

// error handling
}, function(err) {
	console.error(err);
});

// when user clicks submit
$("#submit").on("click", function(e) {

	// prevent automatic form refresh
	e.preventDefault();

	// render info on DOM
	renderInput();

});