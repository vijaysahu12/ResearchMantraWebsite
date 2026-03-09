import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-complaints-summary',
    standalone: true,
    imports: [],
    template: `
<section class="complaints-section">
    <div class="container">
        <h2 class="section-title">Number Of Client's Complaints</h2>
        <p class="update-note">Data of the month ending Jan, 2026 (Data is updated on 7th of every month)</p>

        <div class="table-container">
            <div class="table-wrapper">
                <table class="complaints-table">
                    <thead>
                        <tr>
                            <th>Received from</th>
                            <th>Pending at the end of last month</th>
                            <th>Received</th>
                            <th>Resolved</th>
                            <th>Total Pending</th>
                            <th>Pending complaints > 3 months</th>
                            <th>Average Resolution time (in days)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Directly from investor</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>SEBI (SCORES)</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                        <tr>
                            <td>Other Sources (if any)</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td><strong>Grand Total</strong></td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                            <td>0</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</section>
    `,
    styleUrl: './complaints-summary.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ComplaintsSummaryComponent { }
