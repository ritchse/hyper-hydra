// prereq

//reset fbos. make sure they use clamp
//code taken from hydra-outputs.js
window.oP = o0.constructor.prototype;
oP.fboSettings = oP.fboSettings
  ? oP.fboSettings
  : Array(2).fill({
      mag: "nearest",
      min: "nearest",
      width: width,
      height: height,
      format: "rgba",
    });
oP.setFbos = function (fbo0, fbo1) {
  var colors = fbo1 ? [fbo0, fbo1] : [fbo0, fbo0];
  this.fboSettings = colors.map((x, i) => {
    return { ...this.fboSettings[i], width: width, height: height, ...x };
  });
  this.fbos = this.fboSettings.map((x) =>
    this.regl.framebuffer({
      color: this.regl.texture(x),
      depthStencil: false,
    })
  );
};
window.oS = { outputs: choo.state.hydra.hydra.o };
oP.setClamp = function () {
  this.setFbos({ wrapS: "clamp", wrapT: "clamp" });
};
oS.setClamp = function () {
  this.outputs.forEach((x) => x.setClamp());
};
oS.setClamp();

// set all coord functions to no-wrap
[
  {
    name: "scroll",
    type: "coord",
    inputs: [
      {
        type: "float",
        name: "scrollX",
        default: 0.5,
      },
      {
        type: "float",
        name: "scrollY",
        default: 0.5,
      },
      {
        type: "float",
        name: "speedX",
        default: 0,
      },
      {
        type: "float",
        name: "speedY",
        default: 0,
      },
    ],
    glsl: `_st.x += scrollX + time*speedX; _st.y += scrollY + time*speedY; return _st;`,
  },
  {
    name: "scrollX",
    type: "coord",
    inputs: [
      {
        type: "float",
        name: "scrollX",
        default: 0.5,
      },
      {
        type: "float",
        name: "speed",
        default: 0,
      },
    ],
    glsl: `_st.x += scrollX + time*speed; return _st;`,
  },
  {
    name: "modulateScrollX",
    type: "combineCoord",
    inputs: [
      {
        type: "float",
        name: "scrollX",
        default: 0.5,
      },
      {
        type: "float",
        name: "speed",
        default: 0,
      },
    ],
    glsl: `_st.x += _c0.r*scrollX + time*speed; return _st;`,
  },
  {
    name: "scrollY",
    type: "coord",
    inputs: [
      {
        type: "float",
        name: "scrollY",
        default: 0.5,
      },
      {
        type: "float",
        name: "speed",
        default: 0,
      },
    ],
    glsl: `_st.y += scrollY + time*speed; return _st;`,
  },
  {
    name: "modulateScrollY",
    type: "combineCoord",
    inputs: [
      {
        type: "float",
        name: "scrollY",
        default: 0.5,
      },
      {
        type: "float",
        name: "speed",
        default: 0,
      },
    ],
    glsl: ` _st.y += _c0.r*scrollY + time*speed; return _st;`,
  },
].forEach((x) => setFunction(x));

// hydraWrap

window.hydraWrap = {};

hydraWrap.defaultList = [
  {
    name: "prev",
    type: "src",
    inputs: [],
    glsl: ` vec4 c0 = texture2D(prevBuffer, wrap(_st));
            //c0 *= step(abs(_st.x-0.5),0.5);
            //c0 *= step(abs(_st.t-0.5),0.5);
            return c0;`,
  },
  {
    name: "src",
    type: "src",
    inputs: [
      {
        type: "sampler2D",
        name: "tex",
        default: NaN,
      },
    ],
    glsl: ` vec4 c0 = texture2D(tex, wrap(_st));
            //c0 *= step(abs(_st.x-0.5),0.5);
            //c0 *= step(abs(_st.t-0.5),0.5);
            return c0;`,
  },
  {
    name: "wrap",
    type: "coord",
    inputs: [],
    glsl: `return wrap(_st);`,
  },
];

hydraWrap.void = false;

hydraWrap.generateFunctionListFromWrapper = function (wrapper) {
  return Array.from(hydraWrap.defaultList).map((_f) => {
    let f = Object.assign({}, _f);
    f.glsl = f.glsl.replace("wrap(_st)", wrapper);
    f.glsl = hydraWrap.void ? f.glsl.replaceAll("//c0", "c0") : f.glsl;
    return f;
  });
};

hydraWrap.wrappers = {
  wrap: "fract(_st)",
  nowrap: "_st",
  mirror: "-abs(fract(_st/2.0)*2.0-1.0)+1.0",
};

hydraWrap.currentWrapper = hydraWrap.wrappers.wrap;

hydraWrap.setWrap = function () {
  hydraWrap.void = false;
  hydraWrap.currentWrapper = hydraWrap.wrappers.wrap;
  hydraWrap
    .generateFunctionListFromWrapper(hydraWrap.wrappers.wrap)
    .forEach((x) => setFunction(x));
};

hydraWrap.setRepeat = hydraWrap.setWrap;

hydraWrap.setNoWrap = function () {
  hydraWrap.void = false;
  hydraWrap.currentWrapper = hydraWrap.wrappers.nowrap;
  hydraWrap
    .generateFunctionListFromWrapper(hydraWrap.wrappers.nowrap)
    .forEach((x) => setFunction(x));
};

hydraWrap.setClamp = hydraWrap.setNoWrap;

hydraWrap.setMirror = function () {
  hydraWrap.void = false;
  hydraWrap.currentWrapper = hydraWrap.wrappers.mirror;
  hydraWrap
    .generateFunctionListFromWrapper(hydraWrap.wrappers.mirror)
    .forEach((x) => setFunction(x));
};

hydraWrap.setCustom = function (wrapper = "_st") {
  hydraWrap.void = false;
  hydraWrap.currentWrapper = wrapper;
  hydraWrap.generateFunctionListFromWrapper(wrapper).forEach((x) => setFunction(x));
};

// setVoid should only be called after setting a wrapping mode
hydraWrap.setVoid = function (to = true) {
  hydraWrap.void = to;
  hydraWrap
    .generateFunctionListFromWrapper(hydraWrap.currentWrapper)
    .forEach((x) => setFunction(x));
};

hydraWrap.setWrap();