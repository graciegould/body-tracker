
import './css/main.css';

import BodyPose from './BodyPose';

const bodyPos = new BodyPose(
    document.querySelector(".installation"),
    true,
    {
        size: { width: 640, height: 480 },
        src: null,
        autoplay: true,
        display: false,
        muted: true,
        loop: true,
        controls: false
    }
);

console.log(bodyPos)