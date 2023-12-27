// import reactLogo from "./assets/react.svg";
// import { useEffect } from "react";
import "./App.css";

function App() {
  // useEffect(() => {
  //   const init = async () => {
  //     const res = await fetch("http://localhost:8080/render");
  //     console.log(await res.text());
  //   };
  //   init();
  // });

  return (
    <>
      <div id="container">
        <img
          id="animation"
          crossOrigin="anonymous"
          src="http://localhost:3000/render"
        />
        <div id="mask"></div>
      </div>
    </>
  );
}

export default App;
