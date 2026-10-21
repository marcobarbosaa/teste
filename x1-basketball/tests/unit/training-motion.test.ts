import { describe, expect, it } from 'vitest';
import { COURT, TRAINING, HOOP, CAMERA, cameraPose, cameraYaw, TrainingSimulation } from '@x1/shared';
import { PerspectiveCamera, Vector3 } from 'three';
describe('quadra, movimento e câmera do treino', () => {
  it('limita o corpo inteiro na quadra, acelera, corre e freia', () => {
    const sim = new TrainingSimulation();
    sim.setMovement({ x: 1, z: -1, sprint: true });
    sim.step(TRAINING.stepSeconds);
    expect(sim.player.speed).toBeLessThan(TRAINING.runSpeed);
    for (let i = 0; i < 1200; i++) sim.step(TRAINING.stepSeconds);
    expect(sim.player.x).toBeLessThanOrEqual(COURT.halfWidth - TRAINING.playerRadius);
    expect(sim.player.z).toBeGreaterThanOrEqual(COURT.minZ + TRAINING.playerRadius);
    sim.setMovement({ x: 0, z: 0, sprint: false });
    for (let i=0;i<60;i++) sim.step(TRAINING.stepSeconds);
    expect(sim.player.speed).toBeLessThan(.001);
  });
  it('W acompanha a referência da câmera, sem aumentar velocidade na diagonal', () => {
    const sim = new TrainingSimulation(); sim.cameraYaw = Math.PI / 2;
    sim.setMovement({ x: 0, z: -1, sprint: false });
    for(let i=0;i<120;i++) sim.step(TRAINING.stepSeconds);
    expect(sim.player.x).toBeLessThan(-3);
    expect(sim.player.z).toBeCloseTo(TRAINING.spawnZ);
  });
  it.each([[-6.9, -6.5], [6.9, -6.5], [-6.9, 6.5], [6.9, 6.5], [0, 1.5], [0, -6.5]])('enquadra personagem e aro em (%s,%s)', (x, z) => {
    const pose = cameraPose(x, z);
    const camera = new PerspectiveCamera(CAMERA.fov, 1366/768, .1, 100);
    camera.position.set(pose.position.x, pose.position.y, pose.position.z);
    camera.lookAt(pose.target.x, pose.target.y, pose.target.z); camera.updateMatrixWorld();
    for (const point of [new Vector3(x, 1, z), new Vector3(HOOP.x, HOOP.y, HOOP.z)]) {
      const screen = point.project(camera);
      expect(Math.abs(screen.x)).toBeLessThan(.95); expect(Math.abs(screen.y)).toBeLessThan(.95);
      expect(screen.z).toBeLessThan(1);
    }
    expect(pose.position.y).toBeGreaterThan(3);
    expect(Math.abs(cameraYaw(x,z))).toBeLessThanOrEqual(CAMERA.maxYaw);
  });
});

