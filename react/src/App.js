import './App.css';
import { useEffect } from 'react';
import { PAGInit } from 'libpag';

function App() {
  useEffect(() => {
    PAGInit().then((PAG) => {
      const url = './like.pag';
      fetch(url)
        .then((response) => response.arrayBuffer())
        .then(async (buffer) => {
          const pagFile = await PAG.PAGFile.load(buffer);
          const canvas = document.getElementById('pag');
          canvas.width = pagFile.width();
          canvas.height = pagFile.height();
          const pagView = await PAG.PAGView.init(pagFile, canvas);
          pagView.setRepeatCount(0);
          await pagView.play();
        });
    });
  });
  return (
    <div className="App">
      <header className="App-header">
        <canvas id="pag"></canvas>
      </header>
    </div>
  );
}

export default App;
