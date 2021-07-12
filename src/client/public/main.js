import * as THREE from '/lib/three.module.min.js';

$(`#start`).on(`click`, () => {
    $(`#start`).hide();

    // Create three.js renderer object
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: `high-performance`
    });

    // Add renderer to the document
    document.body.appendChild(renderer.domElement);

    // Create the Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create the Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1e4);

    // Create the font loader.
    const loader = new THREE.FontLoader();

    let text;
    $.get(`https://ipinfo.io`, (response) => {
        loader.load(`/fonts/helvetiker_regular.typeface.json`, (font) => {
            text = new THREE.Mesh(new THREE.TextGeometry(response.ip || `127.0.0.1`, {
                font: font,
                size: 150,
                height: 5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 10,
                bevelSize: 8,
                bevelOffset: 0,
                bevelSegments: 5
            }), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        
            scene.add(text);
            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(text);
            camera.position.copy(boundingBox.getCenter(new THREE.Vector3()));
            camera.position.z += 800;
        });
    }, `json`);

    const audio = document.getElementById(`music`);
    audio.play();
    const context = new AudioContext();
    const src = context.createMediaElementSource(audio);
    const analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    /**
     * Updates the viewport if it is resized.
     * @returns {void} Void.
     */
    const updateViewport = () => {
        if (renderer) renderer.setSize(window.innerWidth, window.innerHeight);
        if (camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
    };
    window.addEventListener(`resize`, updateViewport, false);

    /**
     * Function to render the scene.
     * @returns {void} Void.
     */
    const animate = () => {
        requestAnimationFrame(animate);

        if (text) {
            analyser.getByteFrequencyData(dataArray);
            const scale = ((dataArray.slice(0, 7).reduce((p, c) => p + c) / dataArray.length) / 50) + 0.3;
            text.rotation.x = Math.sin(Date.now() / 600) / 2
            text.rotation.y = Math.cos(Date.now() / 350) / 1.5
            text.rotation.z = (Math.sin(Date.now() / 700) / 1.5) + 0.5
            text.scale.set(scale, scale, scale)
            scene.background.r = (scale * 5) / 255
            scene.background.g = (scale * 5) / 255
            scene.background.b = (scale * 5) / 255
        }

        camera.updateProjectionMatrix();
        renderer.clear();
        renderer.render(scene, camera);
    };

    updateViewport();
    animate();
});
