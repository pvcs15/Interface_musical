STEPS_PER_CHORD = 8; 
STEPS_PER_PROG = 4 * STEPS_PER_CHORD;


NUM_REPS = 4 ;


const model = new mm.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
const player = new mm.Player();
var playing = false;


var currentChords = undefined;


const playOnce = () => {
  const chords = currentChords;
  
  
  const root = mm.chords.ChordSymbols.root(chords[0]);
  const seq = { 
    quantizationInfo: {stepsPerQuarter: 4}, 
    notes: [],
    totalQuantizedSteps: 1
  };  
  
  document.getElementById('message').innerText = '' + chords;
// https://magenta.github.io/magenta-js/music/classes/_music_rnn_model_.musicrnn.html#continuesequence -> Documentação aqui do continueSequence;
// Eu acho uma boa dar a opção pro usuário de quantos "chords" ele quer (basicamente os acordes que tem na tela pra ele botar)
// Dar as opções de acordes pra ele não ter que digitar, já facilita pra quem não é músico feito a gente
// Mexer nesse terceiro parametro, "temperature", quanto mais alto o valor mais "random" vai ser a música gerada (deve ser um input do usuário pra ele escolher esse nível que ele quer)
// Dar a opção pro usuário escolher as duas primeiras linhas desse codigo, que é basicamente o tamanho da música, duração da batida, tem que ir testando pra ver o que cada um altera pra
// jogar isso no front.
//  Pode até ver como mudando os valores do "quantizationInfo" e "totalQuantizedSteps" da variável "seq", como isso altera o som.
// O usuário tem poder apenas nos acordes que ele vai querer passar como input, então a gente deve dar a opção pra ele botar som de bateria, sons mais graves, mais agudos,
// além de escolher o acorde, tem que ver os valores que vão ficar na variável "notes" do "seq". É lá que a gente consegue mudar o som e tipo de som do acorde, mudar o instrumento e tal
// A ideia é a gente botar essas entradas pro usuário sem ele escolher de fato números, por exemplo:
// no terceiro parametro do "continueSequence" que é a "temperature", poderia ser um slider saca? ao invés do cara escolher de fato o númeo "1.2", ele arrasta um slider pro lado que ele quer
// é difícil de fazer isso no html? eu não faço ideia
  model.continueSequence(seq, STEPS_PER_PROG + (NUM_REPS-1)*STEPS_PER_PROG - 1, 0.9, chords)
    .then((contSeq) => {
      
      contSeq.notes.forEach((note) => {
        note.quantizedStartStep += 1;
        note.quantizedEndStep += 1;
        seq.notes.push(note);
      });
    
      const roots = chords.map(mm.chords.ChordSymbols.root);
      for (var i=0; i<NUM_REPS; i++) { 
        
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[0],
          quantizedStartStep: i*STEPS_PER_PROG,
          quantizedEndStep: i*STEPS_PER_PROG + STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[1],
          quantizedStartStep: i*STEPS_PER_PROG + STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 2*STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[2],
          quantizedStartStep: i*STEPS_PER_PROG + 2*STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 3*STEPS_PER_CHORD
        });
        seq.notes.push({
          instrument: 1,
          program: 32,
          pitch: 36 + roots[3],
          quantizedStartStep: i*STEPS_PER_PROG + 3*STEPS_PER_CHORD,
          quantizedEndStep: i*STEPS_PER_PROG + 4*STEPS_PER_CHORD
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


const checkChords = () => {
  const chords = [
    document.getElementById('chord1').value,
    document.getElementById('chord2').value,
    document.getElementById('chord3').value,
    document.getElementById('chord4').value
  ]; 
 
  const isGood = (chord) => {
    if (!chord) {
      return false;
    }
    try {
      mm.chords.ChordSymbols.pitches(chord);
      return true;
    }
    catch(e) {
      return false;
    }
  }
  
  var allGood = true;
  if (isGood(chords[0])) {
    document.getElementById('chord1').style.color = 'black';
  } else {
    document.getElementById('chord1').style.color = 'red';
    allGood = false;
  }
  if (isGood(chords[1])) {
    document.getElementById('chord2').style.color = 'black';
  } else {
    document.getElementById('chord2').style.color = 'red';
    allGood = false;
  }
  if (isGood(chords[2])) {
    document.getElementById('chord3').style.color = 'black';
  } else {
    document.getElementById('chord3').style.color = 'red';
    allGood = false;
  }
  if (isGood(chords[3])) {
    document.getElementById('chord4').style.color = 'black';
  } else {
    document.getElementById('chord4').style.color = 'red';
    allGood = false;
  }
  
  var changed = false;
  if (currentChords) {
    if (chords[0] !== currentChords[0]) {changed = true;}
    if (chords[1] !== currentChords[1]) {changed = true;}
    if (chords[2] !== currentChords[2]) {changed = true;}
    if (chords[3] !== currentChords[3]) {changed = true;}  
  }
  else {changed = true;}
  document.getElementById('play').disabled = !allGood || (!changed && playing);
}


model.initialize().then(() => {
  document.getElementById('message').innerText = ''
  document.getElementById('play').disabled = false;
});


document.getElementById('play').onclick = () => {
  playing = true;
  document.getElementById('play').disabled = true;
  currentChords = [
    document.getElementById('chord1').value,
    document.getElementById('chord2').value,
    document.getElementById('chord3').value,
    document.getElementById('chord4').value    
  ];
  
  mm.Player.tone.context.resume();
  player.stop();
  playOnce();
}


document.getElementById('chord1').oninput = checkChords;
document.getElementById('chord2').oninput = checkChords;
document.getElementById('chord3').oninput = checkChords;
document.getElementById('chord4').oninput = checkChords;
