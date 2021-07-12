import * as THREE from '/lib/three.module.min.js';

$(`#start`).on(`click`, () => {
    $(`#start`).hide();
    $(`#disclaimer`).fadeIn(1e4);

    // Create three.js renderer object
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: `high-performance`
    });
    renderer.shadowMap.enabled = true;

    // Add renderer to the document
    document.body.appendChild(renderer.domElement);

    // Create the Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Create the Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2e4);
    camera.position.set(0, 0, 2e3);

    // Create the font loader.
    const loader = new THREE.FontLoader();

    // Create the particles.
    let particles;
    let count = 0;
    const SEPARATION = 100;
    const AMOUNTX = 125;
    const AMOUNTY = 125;
    const numParticles = AMOUNTX * AMOUNTY;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);
    let i = 0; let j = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
  			for (let iy = 0; iy < AMOUNTY; iy++) {
            positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2);
            positions[i + 1] = -800;
            positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2);
            scales[j] = 1;
            i += 3;
            j++;
  			}
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(`position`, new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(`scale`, new THREE.BufferAttribute(scales, 1));
    const material = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xffffff) } },
        vertexShader: document.getElementById(`vertexshader`).textContent,
        fragmentShader: document.getElementById(`fragmentshader`).textContent
    });
    particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Play and get audio data.
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

    // Create the IP text.
    let pivot;
    $.get(`https://api.ipify.org?format=json`, (response) => {
        loader.load(`/fonts/helvetiker_regular.typeface.json`, (font) => {
            const text = new THREE.Mesh(new THREE.TextGeometry(response.ip || `127.0.0.1`, {
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

            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(text);
            boundingBox.getCenter(text.position);
            text.position.multiplyScalar(-1);
            pivot = new THREE.Group();
            scene.add(pivot);
            pivot.add(text);
        });
    }, `json`);

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

        // Update geometry.
        if (pivot) {
            analyser.getByteFrequencyData(dataArray);
            const scale = ((dataArray.slice(0, 7).reduce((p, c) => p + c) / dataArray.length) / 40) + 0.2;
            pivot.rotation.x = Math.cos(Date.now() / 450);
            pivot.rotation.y = (Math.sin(Date.now() / 600) + (3 * Math.cos(Date.now() / 1200))) / 3;
            pivot.rotation.z = Math.sin(Date.now() / 700);
            pivot.scale.set(scale, scale, scale);
            scene.background.r = (scale * 6) / 255;
            scene.background.g = (scale * 6) / 255;
            scene.background.b = (scale * 6) / 255;

            count += 0.1;
            const positions = particles.geometry.attributes.position.array;
            const scales = particles.geometry.attributes.scale.array;
            let i = 0; let j = 0;
            for (let ix = 0; ix < AMOUNTX; ix++) {
                for (let iy = 0; iy < AMOUNTY; iy++) {
                    positions[i + 1] = (((Math.sin((ix + count) * 0.3) * 50) + (Math.sin((iy + count) * 0.5) * 50)) * (scale * 0.7) * (dataArray[Math.round((iy / AMOUNTY) * dataArray.length)] / 175)) - 800;
                    scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 20 + (Math.sin((iy + count) * 0.5) + 1) * 10 * scale;
                    i += 3;
                    j++;
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
            particles.geometry.attributes.scale.needsUpdate = true;

            camera.rotation.x = Math.cos(Date.now() / 1000) / 10;
            camera.rotation.y = Math.sin(Date.now() / 1000) / 15;
            camera.rotation.z = (Math.cos(Date.now() / 1000) - 0.5) / 15;
            camera.position.z = ((Math.sin(Date.now() / 600) + (3 * Math.cos(Date.now() / 1200))) * 300) + 2000;
        }

        camera.updateProjectionMatrix();
        renderer.clear();
        renderer.render(scene, camera);
    };

    updateViewport();
    animate();
});
