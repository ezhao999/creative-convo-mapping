//Needs Python web server to run
//python -m simpleHTTPServer 8000

var toBeParsed = "Discord_Convo_Merged.csv";

const user1 = "Fluffel"
const user2 = "FryingHamster"

//parsed CSV data to below
var discordData;


//fields to sort convo  by
var currLine = 0;
var currStage = 0;
var currUser = user1;

//Papa.parse(toBeParsed, {
//    download: true,
//    delimiter: ',',
//    header: true,
//    complete: function (results) {
//        discordData = results.data;
//        console.log("Parsing complete:", results);
//    }
//});

function returnData(data, field) {
    for (let i = 1; i < data.length; i++) {
        console.log(data[i][field]);
    }
}


//Finish parsing CSV, then if successful, perform returnData().
//Else, show a timeout message in the console. 
let myPromise = new Promise(function (myResolve, myReject) {
    Papa.parse(toBeParsed, {
        download: true,
        delimiter: ',',
        header: true,
        complete: function (results) {
            discordData = results.data;
            console.log("Parsing complete:", results);
            myResolve(discordData);
        }
    });

    setTimeout(function () { myReject("Promise Error: Timeout") }, 5000);
});

myPromise.then(
    function (value) {
        //returnData(value, "Username");
        //console.log(sortConvo(value));
        document.getElementById("first").onclick = function() {onClickConvo(this.id, value, currLine)};
    },
    function (error) {
        console.log(error);
    },
);


function heroTexts(parsedCSV) { //Creates blocks for each stage to show

    //Should take input of createBlock(parsedCSV)

}

/*
High-level code:

In conversation mode, when user clicks once, generate one text block based on the 
last starting position.

Type out the text letter by letter, save the last CSV position

repeat

Click behavior - starting from clicking on a "home" text block: 

1)


*/


function createBlock(parsedCSV, position) {
    //generates single text block
    let content = "";
    let user = parsedCSV[position]["Username"];
    console.log("starting line " + position);
        while(parsedCSV[position]["Username"] == user){
            console.log("executing " + position);
            //add a new line only when not the first instance
            if (content != ""){
                content += "\n";
            }

            content += parsedCSV[position]["Content"];
            if (position == parsedCSV.length - 1)
                break;
            position++;
        }
    
    currLine = position;
    currUser = parsedCSV[position]["Username"];
    return content;
}

// function blockToDiv(text) {
//     //function to create a new text block
//     const newBlock = document.createElement("p");
//     newBlock.innerHTML = text;
//     return newBlock;
// }

function typeText(div, text, pos) {
    console.log(div);
    const speed = 25;

    if (pos < text.length) {
        document.getElementById(div).innerHTML += text.charAt(pos);
        console.log(text.charAt(pos));
        pos++;
        setTimeout(function() {typeText(div, text, pos)}, speed);
    } else {
        console.log(`Setting onclick for ${div}`);
        document.getElementById(div).onclick = function() {onClickConvo(div, discordData, currLine)};
    }
}

function onClickConvo(clickID, parsedCSV, position){
    document.getElementById(clickID).onclick = null;
    document.getElementById(clickID).removeAttribute("id");

    content = createBlock(parsedCSV, position);
    // newBlock = blockToDiv(content);
    newBlock = document.createElement("p");
    if(parsedCSV[position]["Username"] == user1)
        newBlock.className = "user1";
    else
        newBlock.className = "user2";
    newBlock.id = "Current";
    newBlock.style = "white-space: pre-wrap;";
    document.body.appendChild(newBlock);

    typeText(newBlock.id, content, 0);

    //newBlock.onclick = function() {onClickConvo(this.id, discordData, currLine)};
    // PROBLEMS FOR TUESDAY:
    // 1)   Typing is offset: Currently, you have to click the current typing animation
    //      in order to advance to the next one.
    //
    //      Current Order: Click current --> new div created and starts typing
    //      New Order: Click current --> type current --> create new div when done typing current
    //      

    // PROBLEMS FOR WEDNESDAY:
    // 1)   How to create a div and set height


}



// function convoLoop(parsedCSV) {
//     //runs through a single stage of the CSV, deletes 
//     currUser = "";
//     currStage = 0;
//     currLine = 1;
// }

/*_________________________________________________*/
 

function sortConvo(parsedCSV) {

    //divide lines into text blocks based on user
    //
    //images (hero or not) count as a separate conversation block

    const stageCount = parsedCSV[parsedCSV.length - 1]["Stage"];
    currStage = 0;
    let userCount1 = 0;
    let userCount2 = 0;
    for (var i = 0; i < parsedCSV.length; i++) {
        //check if index is above current
        if (parsedCSV[i]["Stage"] != currStage){
            if (parsedCSV[i]["Username"] == user1)
                userCount1++;
            if (parsedCSV[i]["Username"] == user2)
                userCount2++;
        }
    }
    currStage = 0;
    return [userCount1, userCount2]

}













//var activities = [
//    { activity: 'Work', amount: 9 },
//    { activity: 'Eat', amount: 1 },
//    { activity: 'Commute', amount: 2 },
//    { activity: 'Play Game', amount: 1 },
//    { activity: 'Sleep', amount: 7 }
//];

//returnData(discordData, name);

//console.log(discordData);