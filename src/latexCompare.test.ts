import { describe, expect, it } from 'vitest'
import { compareLatex } from './latexCompare'

describe('compareLatex', () => {
  const equivalentCases = [
    [String.raw`\sqrt{x^2+y^2}`, String.raw`\sqrt{x^2 + y^2}`],
    [String.raw`\sqrt{2}`, String.raw`\sqrt 2`],
    [String.raw`\sum_{i=1}^{n} i^2`, String.raw`\sum^{n}_{1=i} i^2`],
    [String.raw`\int_{0}^{\pi} \sin x \, dx`, String.raw`\int ^ \pi _0 \sin x \, dx`],
    [String.raw`\int_{-\pi}^{\pi} \cos x \, dx`, String.raw`\int ^\pi _{-\pi} \cos x dx`],
    [String.raw`H(X)=-\sum_x p(x) \log p(x)`, String.raw`H(X) = -\sum_{x} p(x)\log p(x)`],
    [String.raw`\|x\|_2=\sqrt{\sum_{i=1}^{n} x_i^2}`, String.raw`\| x \|_2 = \sqrt {\sum^n_{i=1} x^2_i}`],
    [String.raw`\vec{v}=\begin{bmatrix} x \\ y \\ z \end{bmatrix}`, String.raw`\vec v = \begin{bmatrix} x \\ y \\ z \end{bmatrix}`],
    [String.raw`P\wedge Q`, String.raw`P\land Q`],
    [String.raw`P\vee Q`, String.raw`P\lor Q`],
    [String.raw`\Gamma^\rho_{\nu\sigma}`, String.raw`\Gamma_{\nu\sigma}^\rho`],
  ]

  const nonEquivalentCases = [
    [String.raw`\{ x \in \mathbb{R} \mid x^2 < 2 \}`, String.raw`\{ x \in \}`],
    [String.raw`\oint_C f(z) \, dz = 2\pi i \sum \operatorname{Res}(f,a_k)`, String.raw`\oint_C f(z)dz = 2\pi i`],
  ]

  it.each(equivalentCases)('treats %s and %s as equivalent', (target, input) => {
    expect(compareLatex(input, target).isComplete).toBe(true)
  })

  it.each(nonEquivalentCases)('does not treat %s and %s as equivalent', (target, input) => {
    expect(compareLatex(input, target).isComplete).toBe(false)
  })
})
