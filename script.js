
// import firebase from 'firebase/app';
// import 'firebase/firestore';

// const firebaseConfig = {
//   apiKey: "AIzaSyAgFf9qOg2yhXzblzzZf_FYkQefQfTr014",
//   authDomain: "quiz-api-firebase.firebaseapp.com",
//   projectId: "quiz-api-firebase",
//   storageBucket: "quiz-api-firebase.appspot.com",
//   messagingSenderId: "160210260853",
//   appId: "1:160210260853:web:a1e990bb29ede8b952393c"
// };

// firebase.initializeApp(firebaseConfig);

// const firestore = firebase.firestore();

let getInfo;
let score = 0;
let gameData = null;
let isResultsStored = false;

// Traer de la API la información que queremos

async function fetchQuestions() {
    try {
        let response = await fetch('https://opentdb.com/api.php?amount=10&category=12&difficulty=medium&type=multiple');
        let data = await response.json();
        let objQuestions = data.results;
        console.log(objQuestions);
        getInfo = objQuestions.map(question => ({
            question: question.question,
            correctAnswer: question.correct_answer,
            incorrectAnswers: question.incorrect_answers
        }));
        localStorage.setItem('questionsData', JSON.stringify(getInfo));
        return getInfo;

    } catch (error) {
        console.log(error);
    }
}

//Randomizar las respuestas

function randomArray() {
    let topNum = 4;
    let numQuestions = 4;
    let questionNumbers = [];
    while (questionNumbers.length != numQuestions) {
        let num = Math.floor(Math.random() * topNum);
        if (!questionNumbers.includes(num)) {
            questionNumbers.push(num);
        }
    }
    return questionNumbers;
}


//Si hay respuestas en LocalStorage, que no se actualice

function getQuestionsFromLocalStorage() {
    let questionsData = localStorage.getItem('questionsData');
    if (questionsData) {
        return JSON.parse(questionsData);
    }
    return null;
}

//Mostrar la primera pregunta
function showQuestion(question, index) {
    let section = document.querySelector('.question-container');
    let article = document.createElement('article');
    article.classList.add('question');
    let arrTemplateString = [
        `
    <input type="radio" id="answer_${index}_correct" name="answer_${index}" value="${question.correctAnswer}">
    <label for="answer_${index}_correct">${question.correctAnswer}</label>
    `,
        `
    <input type="radio" id="answer_${index}_incorrect1" name="answer_${index}" value="${question.incorrectAnswers[0]}">
    <label for="answer_${index}_incorrect1">${question.incorrectAnswers[0]}</label>
    `,
        `
    <input type="radio" id="answer_${index}_incorrect2" name="answer_${index}" value="${question.incorrectAnswers[1]}">
    <label for="answer_${index}_incorrect2">${question.incorrectAnswers[1]}</label>
    `,
        `
    <input type="radio" id="answer_${index}_incorrect3" name="answer_${index}" value="${question.incorrectAnswers[2]}">
    <label for="answer_${index}_incorrect3">${question.incorrectAnswers[2]}</label>
    `
    ]

    let arrRandom = randomArray()
    let print = `<h2>${question.question}</h2>
        ${arrTemplateString[arrRandom[0]]}
        ${arrTemplateString[arrRandom[1]]}
        ${arrTemplateString[arrRandom[2]]}
        ${arrTemplateString[arrRandom[3]]}`;

    article.innerHTML = print;
    section.appendChild(article);
}

//Mostrar la siguiente pregunta
function showNextQuestion() {
    let section = document.querySelector('.question-container');
    let questions = section.querySelectorAll('.question');
    let currentIndex = 0;
    function showQuestionAtIndex(index) {
        questions.forEach((question, i) => {
            if (i === index) {
                question.style.display = 'block';
            } else {
                question.style.display = 'none';
            }
        });
    }
    
    //Comprobar si el usuario ha seleccionado una opcion y si es la correcta que se sume al marcador
    
    function handleNextButtonClick() {
        const selectedAnswer = questions[currentIndex].querySelector(`input[name="answer_${currentIndex}"]:checked`);
        if (!selectedAnswer) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Giving up already? Select an answer, you bastard',
                color: '#0AA88E',
                confirmButtonColor: '#0AA88E',
            })
            return;
        }
        const userAnswer = selectedAnswer.value;
        const correctAnswer = getInfo[currentIndex].correctAnswer;
        const isAnswerCorrect = userAnswer === correctAnswer;

        if (isAnswerCorrect) {
            score++;
        }
        currentIndex++;
        if (currentIndex < questions.length) {
            showQuestionAtIndex(currentIndex);
        } else {
            window.location.href = 'results.html';
        }
    }
    //Que la ultima pregunta vaya a la página de resultados
    function handleLastQuestion() {
        nextButton.innerHTML = `<a href="results.html">Show Results</a>`;
        nextButton.removeEventListener('click', handleNextButtonClick);

        if (!isResultsStored) {
            const currentDate = new Date().toLocaleDateString();
            gameData = {
                score,
                date: currentDate
            };


            let scoresData = [];
            if (localStorage.getItem('gameData')) {
                scoresData = JSON.parse(localStorage.getItem('gameData'));
            }

            scoresData.push(gameData);
            localStorage.setItem('gameData', JSON.stringify(scoresData));
            isResultsStored = true;
            enviarDatosAFirebase();
        }
    }

    let nextButton = document.querySelector('.button-next');
    nextButton.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) {
            handleNextButtonClick()
        }
        else {
            handleLastQuestion()
        }
    });
    showQuestionAtIndex(currentIndex);

}

// Pintar el resultado en el DOM
function showResult() {
    let resultsSection = document.querySelector('.results');
    let scoresData = JSON.parse(localStorage.getItem('gameData'));


    if (scoresData && scoresData.length > 0) {
        let lastScore = scoresData[scoresData.length - 1];
        let resultTemplate = `<p class='printResult'>${lastScore.score}</p>`;
        resultsSection.innerHTML = resultTemplate;
    }
}


async function printQuestionsAndAnswers() {
    let getInfo = await fetchQuestions();
    if (getInfo) {
        getInfo.forEach((question, index) => {
            showQuestion(question, index);
        });
        showNextQuestion();
        showResult();
    }
}

printQuestionsAndAnswers();

//Chartist
const getData = JSON.parse(localStorage.getItem('gameData'));
const dates = getData.map(gameData => gameData.date);
const scores = getData.map(gameData => gameData.score);


var data = {
    labels: dates,
    series: [scores]
};
var options = {
    width: '100%',
    height: 800,
    high: 10,
    low: 0,
    axisY: {
        onlyInteger: true,
        offset: 20
    },
    chartPadding: {
        top: 50,
        right: 100,
        bottom: 1,
        left: 100
    },
};
var responsiveOptions = [
    ['screen and (min-width: 641px)and (max-width: 1024px)', {
        showPoint: false,
        axisX: {
            labelInterpolationFnc: function (value) {
                // Will return Mon, Tue, Wed etc. on medium screens
                return value.slice(0, 4);
            }
        },
        chartPadding: {
            top: 50,
            right: 100,
            bottom: 1,
            left: 100
        },
    }],
    ['screen and (max-width: 640px)', {
        showLine: false,
        axisX: {
            labelInterpolationFnc: function (value) {
                // Will return M, T, W etc. on small screens
                return value.slice(0, 4);
            }
        },
        chartPadding: {
            top: 50,
            right: 10,
            bottom: 10,
            left: 10
        },
    }]
];


new Chartist.Line('.ct-chart', data, options, responsiveOptions);

//FIREBASE
// function enviarDatosAFirebase() {
//   const colRef = firestore.collection('scoreData');
//     colRef.add({
//     score: gameData.score,
//     date: gameData.date
//   })
//   .then(function(docRef) {
//     console.log("Datos de puntuación agregados con éxito:", docRef.id);
//   })
//   .catch(function(error) {
//     console.error("Error al agregar los datos de puntuación: ", error);
//   });
// }




/* async function saveScoreFirebase() {
    db.collection("scores")
        .add({
            date: Date(),
            score: scores,
        })
        .then((docRef) => {
            console.log("Document written with ID: ", docRef.id);
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
        });
}
saveScoreFirebase() */


