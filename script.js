STEPS_PER_CHORD = 0
STEPS_PER_PROG = 0
NUM_REPS = 0


const model = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
const player = new mm.Player();
var playing = false;


var currentChords = undefined;

function escolherRitmo() {
  if ($('#rapido').is(':checked')) {
    STEPS_PER_CHORD = 10;
    STEPS_PER_PROG = 4 * STEPS_PER_CHORD;
    NUM_REPS = 4;
  } else {
    STEPS_PER_CHORD = 3;
    STEPS_PER_PROG = 3 * STEPS_PER_CHORD;
    NUM_REPS = 6;
  }
}
$('#rapido').click(function () {
  escolherRitmo();
});

$('#lento').click(function () {
  escolherRitmo();
});

function random(arg) {

  if ($.isArray(arg)) {
    return arg[random(arg.length)];
  } else if (typeof arg === "number") {
    return Math.floor(Math.random() * arg);
  } else {
    return 4;  // chosen by fair dice roll
  }
}

$('#random').click(function () {
  var items = ["A", "B", "C", "D", "E", "F", "G", "Am", "Bm", "Cm", "Dm", "Em", "Fm", "Gm"];
  var quantAcordes = $('#acordes').val();
  for (var i = 0; i < quantAcordes; i++) {

    var select = $('#trAcordes select')[i];
    var acorde = random(items);
    console.log(acorde)
    $(select).val(acorde);
  }

});

const playOnce = () => {
  const chords = currentChords;


  const root = mm.chords.ChordSymbols.root(chords[0]);
  const seq = {
    quantizationInfo: { stepsPerQuarter: 4 },
    notes: [],
    totalQuantizedSteps: 1
  };

  document.getElementById('message').innerText = '' + chords;
  // https://magenta.github.io/magenta-js/music/classes/_music_rnn_model_.musicrnn.html#continuesequence -> Documentação aqui do continueSequence;

  // Mexer nesse terceiro parametro, "temperature", quanto mais alto o valor mais "random" vai ser a música gerada (deve ser um input do usuário pra ele escolher esse nível que ele quer)
  // Dar a opção pro usuário escolher as duas primeiras linhas desse codigo, que é basicamente o tamanho da música, duração da batida, tem que ir testando pra ver o que cada um altera pra
  // jogar isso no front.
  //  Pode até ver como mudando os valores do "quantizationInfo" e "totalQuantizedSteps" da variável "seq", como isso altera o som.
  // O usuário tem poder apenas nos acordes que ele vai querer passar como input, então a gente deve dar a opção pra ele botar som de bateria, sons mais graves, mais agudos,
  // além de escolher o acorde, tem que ver os valores que vão ficar na variável "notes" do "seq". É lá que a gente consegue mudar o som e tipo de som do acorde, mudar o instrumento e tal
  console.log(STEPS_PER_PROG)
  model.continueSequence(seq, STEPS_PER_PROG + (NUM_REPS - 1) * STEPS_PER_PROG - 1, $('#myRange').val() / 50, chords)
    .then((contSeq) => {

      contSeq.notes.forEach((note) => {
        note.quantizedStartStep += 1;
        note.quantizedEndStep += 1;
        seq.notes.push(note);
      });

      const roots = chords.map(mm.chords.ChordSymbols.root);
      for (var i = 0; i < NUM_REPS; i++) {

        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[0],
          quantizedStartStep: i * STEPS_PER_PROG,
          quantizedEndStep: i * STEPS_PER_PROG + STEPS_PER_CHORD,
          isDrum: true
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[1],
          quantizedStartStep: i * STEPS_PER_PROG + STEPS_PER_CHORD,
          quantizedEndStep: i * STEPS_PER_PROG + 2 * STEPS_PER_CHORD,
          isDrum: true
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[2],
          quantizedStartStep: i * STEPS_PER_PROG + 2 * STEPS_PER_CHORD,
          quantizedEndStep: i * STEPS_PER_PROG + 3 * STEPS_PER_CHORD,
          isDrum: true
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[3],
          quantizedStartStep: i * STEPS_PER_PROG + 3 * STEPS_PER_CHORD,
          quantizedEndStep: i * STEPS_PER_PROG + 4 * STEPS_PER_CHORD,
          isDrum: true
        });
      }


      seq.totalQuantizedSteps = STEPS_PER_PROG * NUM_REPS;


      player.start(seq, 120).then(() => {
        playing = false;
        document.getElementById('message').innerText = '';
        checkChords();
      });
    })
}

$('#acordes').keyup(function () {
  addInputs();

});

function addInputs() {

  var quantAcordes = $('#acordes').val();
  for (var i = $('#trAcordes select').length; i < quantAcordes; i++) {

    $("#trAcordes").append("<td><select id='instrumento'><option value='A'>A</option><option value='B'>B</option><option value='C'>C</option><option value='D'>D</option><option value='E'>E</option><option value='F'>F</option><option value='G'>G</option>" +
      "<option value='Am'>Am</option><option value='Bm'>Bm</option><option value='Cm'>Cm</option><option value='Dm'>Dm</option><option value='Em'>Em</option><option value='Fm'>Fm</option><option value='Gm'>Gm</option></select></td>");
  }
};

const checkChords = () => {

  const chords = [];
  var quant = $('#trAcordes select');
  for (var i = 0; i < quant.length; i++) {
    chords.push(quant[i].value)
  }

  const isGood = (chord) => {
    if (!chord) {
      return false;
    }
    try {
      mm.chords.ChordSymbols.pitches(chord);
      return true;
    }
    catch (e) {
      return false;
    }
  }
}


model.initialize().then(() => {
  document.getElementById('message').innerText = ''
  document.getElementById('play').disabled = false;
});


document.getElementById('play').onclick = () => {
  playing = true;
  currentChords = [];
  var quant = $('#trAcordes select');
  for (var i = 0; i < quant.length; i++) {
    currentChords.push(quant[i].value)
  }

  mm.Player.tone.context.resume();
  player.stop();
  playOnce();
}


document.getElementById('chord1').oninput = checkChords;
document.getElementById('chord2').oninput = checkChords;
document.getElementById('chord3').oninput = checkChords;
document.getElementById('chord4').oninput = checkChords;
