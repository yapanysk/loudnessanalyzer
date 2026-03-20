self.onmessage = function(e) {
    const { type, payload } = e.data;

    if (type === 'START_ANALYSIS') {
        const { sampleRate, left, right } = payload;
        const n = left.length;

        // --- 1. K-Weighting フィルタ係数 (ITU-R BS.1770) ---
        const a1 = -1.69065929318241, a2 = 0.73248077421585;
        const b0 = 1.53512485958697, b1 = -2.69169618940638, b2 = 1.19839281392814;
        const ar1 = -1.99004745483398, ar2 = 0.99007225036621;
        const br0 = 1.0, br1 = -2.0, br2 = 1.0;

        // 左チャンネル用の一時変数
        let l_x1 = 0, l_x2 = 0, l_y1 = 0, l_y2 = 0;
        let l_xr1 = 0, l_xr2 = 0, l_yr1 = 0, l_yr2 = 0;

        // 右チャンネル用の一時変数
        let r_x1 = 0, r_x2 = 0, r_y1 = 0, r_y2 = 0;
        let r_xr1 = 0, r_xr2 = 0, r_yr1 = 0, r_yr2 = 0;

        // ステレオ合算エネルギー保持用
        const combinedPower = new Float32Array(n);

        // --- 2. フィルタリング & ステレオサミング ---
        for (let i = 0; i < n; i++) {
            // Left Channel
            const l_out1 = b0 * left[i] + b1 * l_x1 + b2 * l_x2 - a1 * l_y1 - a2 * l_y2;
            l_x2 = l_x1; l_x1 = left[i]; l_y2 = l_y1; l_y1 = l_out1;
            const l_out2 = br0 * l_out1 + br1 * l_xr1 + br2 * l_xr2 - ar1 * l_yr1 - ar2 * l_yr2;
            l_xr2 = l_xr1; l_xr1 = l_out1; l_yr2 = l_yr1; l_yr1 = l_out2;

            // Right Channel
            const r_out1 = b0 * right[i] + b1 * r_x1 + b2 * r_x2 - a1 * r_y1 - a2 * r_y2;
            r_x2 = r_x1; r_x1 = right[i]; r_y2 = r_y1; r_y1 = r_out1;
            const r_out2 = br0 * r_out1 + br1 * r_xr1 + br2 * r_xr2 - ar1 * r_yr1 - ar2 * r_yr2;
            r_xr2 = r_xr1; r_xr1 = r_out1; r_yr2 = r_yr1; r_yr1 = r_out2;

            // エネルギー合算 (L^2 + R^2)
            combinedPower[i] = (l_out2 * l_out2) + (r_out2 * r_out2);

            if (i % Math.floor(n / 10) === 0) {
                self.postMessage({ type: 'PROGRESS', payload: Math.round((i / n) * 100) });
            }
        }

        // --- 3. ゲート付きブロック処理 (400ms Window, 100ms Step) ---
        const blockSize = Math.floor(sampleRate * 0.4);
        const stepSize = Math.floor(sampleRate * 0.1);
        const blockPowers = [];

        for (let i = 0; i <= n - blockSize; i += stepSize) {
            let sumPower = 0;
            for (let j = 0; j < blockSize; j++) {
                sumPower += combinedPower[i + j];
            }
            const avgPower = sumPower / blockSize;
            
            // 絶対ゲート (-70 LUFS)
            if (avgPower > 0 && 10 * Math.log10(avgPower) - 0.691 > -70) {
                blockPowers.push(avgPower);
            }
        }

        if (blockPowers.length === 0) {
            self.postMessage({ type: 'RESULT', payload: "-INF" });
            return;
        }

        // --- 4. 相対ゲート処理 ---
        const initialAverage = blockPowers.reduce((a, b) => a + b, 0) / blockPowers.length;
        const relativeThresholddB = 10 * Math.log10(initialAverage) - 0.691 - 10;

        const gatedPowers = blockPowers.filter(p => (10 * Math.log10(p) - 0.691) > relativeThresholddB);
        
        const finalPower = gatedPowers.length > 0 
            ? gatedPowers.reduce((a, b) => a + b, 0) / gatedPowers.length 
            : initialAverage;

        const integratedLufs = 10 * Math.log10(finalPower + 1e-12) - 0.691;

        self.postMessage({ type: 'RESULT', payload: integratedLufs.toFixed(2) });
    }
};