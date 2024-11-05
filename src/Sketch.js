import p5 from 'p5';

const defaultConfig = {
    id: 'defaultCanvas',
    size: { width: 640, height: 480 },
    noLoop: false,
};

class Sketch {
    /**
     * Creates an instance of the Sketch class.
     * 
     * @constructor
     * @param {HTMLElement} parent - The parent element to attach the canvas to.
     * 
     */
    constructor(
        parent,
        animation,
        config
    ) {
        this.parent = parent;
        this.config = { ...defaultConfig, ...config };
        this.p = new p5((p) => animation(p, config), parent);
    }
}

export default Sketch;