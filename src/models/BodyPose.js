import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

const defaultConfig = {
    size: { width: 640, height: 480 },
    src: null,
    autoplay: true,
    display: true,
    muted: true,
    loop: true,
    controls: false
};

class BodyPose {
    constructor(
        parent,
        useWebcam = true,
        config = defaultConfig
    ) {
        this.parent = parent;
        this.useWebcam = useWebcam;
        this.net = null;
        this.pose = null;
        this.poseHistory = [];
        this.poseHistoryLength = 10;
        this.poseHistoryIndex = 0;
        this.config = { ...defaultConfig, ...config };
        this.video = document.createElement('video');

        this.tuner = {
            flipHorizontal: this.useWebcam ? true : false,
            // maxDetections: 30,
            // scoreThreshold: 0.8,
            // nmsRadius: 10,
        };
        this.debug = true;
        this.loaded = false;
        (async () => {
              await this.load();
              await this.init();
            this.video.addEventListener('loadeddata', () => {
                console.log('Video frames are coming through.');
                this.loaded = true;
            });
        })();
    }

    async init() {
        if (this.useWebcam) {
            try {
                console.log("Loading webcam...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                this.video.srcObject = stream;
                console.log("Webcam loaded.");
            } catch (error) {
                throw new Error('Failed to access the webcam: ' + error.message);
            }
        }
        this.video.width = this.config.size.width;
        this.video.height = this.config.size.height;
        this.video.src = this.useWebcam ? null : this.config.src;
        this.video.autoplay = this.config.autoplay;
        this.video.muted = this.config.muted;
        this.video.loop = this.config.loop;
        this.video.controls = this.config.controls;
        this.video.style.display = this.config.display ? 'block' : 'none';
        this.parent.appendChild(this.video);
        this.debug = false;
        if(!this.useWebcam) {
            this.video.play();
        }
    }

    async load() {
        try {
            console.log("Loading PoseNet model...");
            this.net = await posenet.load({
                architecture: 'ResNet50',
                outputStride: 32
              });
            console.log("PoseNet model loaded.");
        } catch (error) {
            throw new Error('Failed to load the PoseNet model: ' + error.message);
        }
    }

    hideVideo() {
        this.video.style.display = 'none';
    }

    showVideo() {
        this.video.style.display = 'block';
    }

    async detectMultiple() {
        if(!this.loaded) return [];
        const poses = await this.net.estimateMultiplePoses(this.video, this.tuner);
        this.poses = poses;
        return poses;
    }

    async detectSingle() {
        const pose = await this.net.estimateSinglePose(this.video, {
            flipHorizontal: this.tuner.flipHorizontal
        });
        this.pose = pose;
        this.poseHistory[this.poseHistoryIndex] = pose;
        this.poseHistoryIndex = (this.poseHistoryIndex + 1) % this.poseHistoryLength;
        if(this.debug) {
            console.log(this.pose);
        }
    }
}

export default BodyPose;