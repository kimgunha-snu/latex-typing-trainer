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
    [String.raw`x\ge y`, String.raw`x\geq y`],
    [String.raw`x\notin A`, String.raw`x\not \in A`],
    [String.raw`x\ne y`, String.raw`x\not = y`],
    [String.raw`x\ne y`, String.raw`x\neq y`],
    [String.raw`\widetilde H_n (*)= 0`, String.raw`\widetilde{H}_n(\ast)=0`],
    [String.raw`(\overbrace{0, \ldots, 0}^{i-1}, 1, 0, \ldots, 0)`, String.raw`(\overbrace{0, \dots, 0}^{i-1}, 1, 0, \dots, 0)`],
    [String.raw`\operatorname{Ext}_R^n (M,N) \cong H^n (\operatorname{Hom}_R(R_\bullet, N))`, String.raw`\operatorname{Ext}^n_R (M,N) \cong H^n (\operatorname{Hom}_R(R_\bullet, N))`],
    [String.raw`\int_\Omega f(x)\,dx`, String.raw`\int_{\Omega} f(x)\,dx`],
    [String.raw`\left \\|\begin {bmatrix}x_1 \\\\ \vdots \\\\x_n\end{bmatrix}\right \\| _2 = (\sum^n_{i=1} x^2_i)^{1/2}`, String.raw`\left\lVert\begin{bmatrix}x_1 \\ \vdots \\ x_n\end{bmatrix}\right\rVert_2=\left(\sum_{i=1}^{n}x_i^2\right)^{1/2}`],
    [String.raw`\Gamma^\rho_{\nu\sigma}`, String.raw`\Gamma_{\nu\sigma}^\rho`],
    [String.raw`\frac{\pi}{4}`, String.raw`\frac{\pi}4`],
    [String.raw`[\hat x, \hat p]_{-} = i\hbar`, String.raw`[\hat{x},\hat{p}]_-=i\hbar`],
    [String.raw`\hat{\beta}=(X^TX)^{-1}X^Ty`, String.raw`\hat\beta = (X^TX)^{-1} X^T y`],
    [String.raw`P(A \mid B)`, String.raw`P(A | B)`],
    [String.raw`\{x \in \mathbb{R} \mid x > 0\}`, String.raw`\{x \in \mathbb{R} | x > 0\}`],
    [String.raw`Z = \int \mathcal D \phi e^{-S_E[\phi]}`, String.raw`Z = \int \mathcal D \phi e^{-S_{E}[\phi]}`],
    [String.raw`R^\rho_{\sigma\mu\nu}=\partial_\mu\Gamma^\rho_{\nu\sigma}-\partial_\nu\Gamma^\rho_{\mu\sigma}+\cdots`, String.raw`R^\rho_{\sigma \mu\nu} = \partial_\mu\Gamma_{\nu\sigma}^\rho - \partial_\nu\Gamma^{\rho}_{\mu\sigma} + \cdots`],
    [String.raw`x \sim p_\theta (x)`, String.raw`x\sim p_{\theta}(x)`],
  ]

  const nonEquivalentCases = [
    [String.raw`\{ x \in \mathbb{R} \mid x^2 < 2 \}`, String.raw`\{ x \in \}`],
    [String.raw`|x|`, String.raw`\mid x \mid`],
    [String.raw`\mathcal{H}=\pi\dot\phi-\mathcal{L}`, String.raw`\mathcal H = \pi \dot \phi`],
    [String.raw`f(n)=\begin{cases}0 & \text{if } n \text{ is even} \\ 1 & \text{if } n \text{ is odd}\end{cases}`, String.raw`f(n)=\begin{cases}0 & \text{if } n \text{ is even} \\ 1 & \text{if } n \text{is}\end{cases}`],
    [String.raw`\oint_C f(z) \, dz = 2\pi i \sum \operatorname{Res}(f,a_k)`, String.raw`\oint_C f(z)dz = 2\pi i`],
  ]

  it.each(equivalentCases)('treats %s and %s as equivalent', (target, input) => {
    expect(compareLatex(input, target).isComplete).toBe(true)
  })

  it.each(nonEquivalentCases)('does not treat %s and %s as equivalent', (target, input) => {
    expect(compareLatex(input, target).isComplete).toBe(false)
  })
})
