
import './css/main.css';
import BodyPose from './models/BodyPose';
import Sketch from './Sketch';
import Delaunator from 'delaunator';

const parent = document.querySelector(".installation");
const size = { width: window.screen.width, height: window.screen.height };
const bodyPose = new BodyPose(
    parent,
    true,
    {
        size: size,
        src: './test.mov',
        autoplay: true,
        display: true,
        muted: true,
        loop: true,
        controls: false
    }
);

const animation = (p, config) => {
    let points = [];
    let triangles = [];
    let originalPoints = [];
    let fadeValue = 0;
    let fadeDirection = 1;
    let tuner = {
        scoreThreshold: 0.5,
        gridSpacing: 50,
        impactRadius: 50,
        maxMovement: 100,
        influence: 0.5,
        predictionInterval: 200,
    };

    let colorIndex = 0;
    class Triangle {
        constructor( pt1, pt2, pt3, colorIndex) {
            this.fillColor = colors[colorIndex];
            const randomColor1 = Math.floor(Math.random() * colors.length);
            const randomColor2 = Math.floor(Math.random() * colors.length);
            this.fillColor1 = p.lerpColor(this.fillColor, colors[randomColor1], 0.5);
            this.fillColor2 = p.lerpColor(this.fillColor, colors[randomColor2], 0.5);
            
            this.strokeColor = 0;
            this.pt1 = pt1;
            this.pt2 = pt2;
            this.pt3 = pt3;
        }
        draw(p) {
            this.fillColor.setAlpha(50);
            p.fill(this.fillColor);
            p.triangle(this.pt1[0], this.pt1[1], this.pt2[0], this.pt2[1], this.pt3[0], this.pt3[1]);
        }
    }
    
    const colors = [
        p.color(255, 182, 193), // Light Pink
        p.color(255, 255, 179), // Light Yellow
        p.color(179, 255, 179), // Light Green
        p.color(179, 255, 255), // Light Cyan
        p.color(179, 179, 255), // Light Blue
        p.color(255, 179, 255), // Light Purple
        p.color(255, 204, 204), // Light Coral
        p.color(204, 229, 255), // Light Sky Blue
        p.color(255, 229, 204), // Light Peach
        p.color(204, 255, 229),  // Light Mint
        p.color(255, 204, 229), // Light Pinkish
        p.color(204, 255, 255), // Light Aqua
        p.color(255, 255, 204), // Light Lemon
        p.color(204, 204, 255), // Light Lavender
        p.color(255, 229, 255), // Light Magenta
        p.color(229, 255, 204), // Light Lime
        p.color(255, 255, 229), // Light Cream
        p.color(229, 204, 255), // Light Violet
        p.color(255, 229, 229), // Light Rose
        p.color(229, 255, 229), // Light Mint Green
        p.color(255, 204, 204), // Light Coral
        p.color(204, 229, 255), // Light Sky Blue
        p.color(255, 229, 204), // Light Peach
        p.color(204, 255, 229), // Light Mint
        p.color(255, 204, 229), // Light Pinkish
        p.color(204, 255, 255), // Light Aqua
        p.color(255, 255, 204), // Light Lemon
        p.color(204, 204, 255), // Light Lavender
        p.color(255, 229, 255), // Light Magenta
        p.color(255, 255, 229), // Light Cream
        p.color(229, 204, 255), // Light Violet
        p.color(255, 229, 229), // Light Rose
        p.color(229, 255, 229), // Light Mint Green
        p.color(255, 204, 153), // Light Apricot
        p.color(204, 255, 204), // Light Pale Green
        p.color(255, 204, 255), // Light Orchid
    ];

    p.setup = () => {
        p.createCanvas(config.size.width, config.size.height);
        p.canvas.id = config.id;
        p.frameRate(60);
        if (config.noLoop) p.noLoop();
        createGrid();
        createTriangles();
        setTimeout(resetTriangles, 100);
        p.noStroke();

    };

    function createGrid() {
        for (let x = 0; x <= window.screen.width + tuner.gridSpacing; x += tuner.gridSpacing) {
            for (let y = 0; y < window.screen.height; y += tuner.gridSpacing) {
                points.push([x, y]);
            }
        }
    }

    function createTriangles() {
        // Sort points to ensure consistent triangulation
        points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const delaunay = Delaunator.from(points);
        const _triangles = delaunay.triangles;
        for (let i = 0; i < _triangles.length; i += 3) {
            const pt1 = points[_triangles[i]];
            const pt2 = points[_triangles[i + 1]];
            const pt3 = points[_triangles[i + 2]];
            originalPoints.push({ pt1: [...pt1], pt2: [...pt2], pt3: [...pt3] });
            colorIndex = (colorIndex + 1) % colors.length;
            triangles.push(new Triangle(pt1, pt2, pt3, colorIndex));
        }
    }

    function redrawTriangles(keypoints) {
        fadeValue += fadeDirection * 0.5;
        if (fadeValue > 255 || fadeValue < 0) {
            fadeDirection *= -1;
        }
        triangles.forEach((triangle, index) => {
            let { pt1, pt2, pt3 } = triangle;
            const original = originalPoints[index];
            const focusKeypoints = keypoints.filter(kp => kp.score > tuner.scoreThreshold);
            focusKeypoints.forEach(keypoint => {
                const { x, y } = keypoint.position;
                if (p.dist(pt1[0], pt1[1], x, y) < tuner.gridSpacing)  {
                    triangle.pt1 = morphPointToKeypoint(pt1, x, y, original.pt1);
                }
                if (p.dist(pt2[0], pt2[1], x, y) < tuner.gridSpacing) {
                    triangle.pt2 = morphPointToKeypoint(pt2, x, y, original.pt2);
                }
                if (p.dist(pt3[0], pt3[1], x, y) < tuner.gridSpacing) {
                    triangle.pt3 = morphPointToKeypoint(pt3, x, y, original.pt3);
                }
            });
            triangle.draw(p);
        });
    }
    
    function morphPointToKeypoint(point, keypointX, keypointY, originalPoint) {
        const distanceToKeypoint = p.dist(point[0], point[1], keypointX, keypointY);
        const maxMovement = p.map(distanceToKeypoint, 0, tuner.impactRadius, tuner.maxMovement, 0);
        const targetX = p.lerp(point[0], keypointX, tuner.influence);
        const targetY = p.lerp(point[1], keypointY, tuner.influence);

        point[0] = p.constrain(targetX, originalPoint[0] - maxMovement, originalPoint[0] + maxMovement);
        point[1] = p.constrain(targetY, originalPoint[1] - maxMovement, originalPoint[1] + maxMovement);

        if (distanceToKeypoint > tuner.impactRadius) {
            point[0] = p.lerp(point[0], originalPoint[0], 0.03);  // Gradually return to original
            point[1] = p.lerp(point[1], originalPoint[1], 0.03);  // Gradually return to original
        }
        return point;
    }

    function resetTriangles() {
        triangles.forEach((triangle, index) => {
            let { pt1, pt2, pt3 } = triangle;
            const original = originalPoints[index];
            triangle.pt1 = [ p.lerp(pt1[0], original.pt1[0], 0.02), p.lerp(pt1[1], original.pt1[1], 0.02) ];
            triangle.pt2 = [ p.lerp(pt2[0], original.pt2[0], 0.02), p.lerp(pt2[1], original.pt2[1], 0.02) ];
            triangle.pt3 = [ p.lerp(pt3[0], original.pt3[0], 0.02), p.lerp(pt3[1], original.pt3[1], 0.02) ];
            triangle.draw(p);
        });
        setTimeout(resetTriangles, 100);
    }

    p.draw = async () => {
        let poses = await bodyPose.detectMultiple();       
        if (poses.length === 0) redrawTriangles([]);
        poses.forEach(pose => {
            if (pose.score > tuner.scoreThreshold) {
                redrawTriangles(pose.keypoints);
            }
        });
    };
};

new Sketch(
    parent,
    animation,
    {
        id: 'installation-canvas',
        size: size
    }
);



