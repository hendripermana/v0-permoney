#!/usr/bin/env node
/**
 * Load Testing Suite for Permoney Backend
 * Tests system performance under various load conditions
 */
const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class LoadTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      requests: [],
      summary: {},
      errors: [],
    };
  }

  async runLoadTest(options = {}) {
    const {
      concurrent = 10,
      duration = 30000, // 30 seconds
      endpoints = ['/health', '/metrics'],
      rampUp = 5000, // 5 seconds
    } = options;

    console.log('🚀 LOAD TESTING SUITE');
    console.log('═'.repeat(50));
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Concurrent Users: ${concurrent}`);
    console.log(`Test Duration: ${duration}ms`);
    console.log(`Ramp-up Time: ${rampUp}ms`);
    console.log(`Endpoints: ${endpoints.join(', ')}`);
    console.log('═'.repeat(50));

    const startTime = Date.now();
    const endTime = startTime + duration;
    
    // Ramp up users gradually
    const workers = [];
    const rampUpInterval = rampUp / concurrent;
    
    for (let i = 0; i < concurrent; i++) {
      setTimeout(() => {
        const worker = this.createWorker(i, endpoints, endTime);
        workers.push(worker);
      }, i * rampUpInterval);
    }

    // Wait for test duration
    await new Promise(resolve => setTimeout(resolve, duration + rampUp));

    // Stop all workers
    workers.forEach(worker => {
      if (worker && worker.stop) {
        worker.stop();
      }
    });

    // Generate report
    this.generateReport();
  }

  createWorker(workerId, endpoints, endTime) {
    let active = true;
    let requestCount = 0;

    const worker = {
      id: workerId,
      stop: () => { active = false; },
    };

    const makeRequests = async () => {
      while (active && Date.now() < endTime) {
        const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
        const startTime = performance.now();
        
        try {
          const response = await this.makeRequest(endpoint);
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.results.requests.push({
            workerId,
            endpoint,
            status: response.statusCode,
            duration,
            timestamp: Date.now(),
            success: response.statusCode >= 200 && response.statusCode < 400,
          });
          
          requestCount++;
        } catch (error) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.results.errors.push({
            workerId,
            endpoint,
            error: error.message,
            duration,
            timestamp: Date.now(),
          });
          
          this.results.requests.push({
            workerId,
            endpoint,
            status: 0,
            duration,
            timestamp: Date.now(),
            success: false,
            error: error.message,
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      }
    };

    makeRequests().catch(error => {
      console.error(`Worker ${workerId} error:`, error);
    });

    return worker;
  }

  makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${endpoint}`;
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', chunk => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  generateReport() {
    const requests = this.results.requests;
    const errors = this.results.errors;
    
    if (requests.length === 0) {
      console.log('❌ No requests completed');
      return;
    }

    // Calculate statistics
    const successfulRequests = requests.filter(r => r.success);
    const failedRequests = requests.filter(r => !r.success);
    
    const durations = successfulRequests.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    // Calculate percentiles
    const sortedDurations = durations.sort((a, b) => a - b);
    const p50 = this.calculatePercentile(sortedDurations, 50);
    const p95 = this.calculatePercentile(sortedDurations, 95);
    const p99 = this.calculatePercentile(sortedDurations, 99);
    
    // Calculate throughput
    const testDuration = (Math.max(...requests.map(r => r.timestamp)) - 
                         Math.min(...requests.map(r => r.timestamp))) / 1000;
    const throughput = requests.length / testDuration;
    
    // Error rate
    const errorRate = (failedRequests.length / requests.length) * 100;
    
    // Status code distribution
    const statusCodes = {};
    requests.forEach(r => {
      statusCodes[r.status] = (statusCodes[r.status] || 0) + 1;
    });

    console.log('\n📊 LOAD TEST RESULTS');
    console.log('═'.repeat(50));
    console.log(`Total Requests: ${requests.length}`);
    console.log(`Successful Requests: ${successfulRequests.length}`);
    console.log(`Failed Requests: ${failedRequests.length}`);
    console.log(`Error Rate: ${errorRate.toFixed(2)}%`);
    console.log(`Test Duration: ${testDuration.toFixed(2)}s`);
    console.log(`Throughput: ${throughput.toFixed(2)} req/s`);
    
    console.log('\n⏱️  RESPONSE TIME STATISTICS');
    console.log('─'.repeat(30));
    console.log(`Average: ${avgDuration.toFixed(2)}ms`);
    console.log(`Minimum: ${minDuration.toFixed(2)}ms`);
    console.log(`Maximum: ${maxDuration.toFixed(2)}ms`);
    console.log(`50th Percentile: ${p50.toFixed(2)}ms`);
    console.log(`95th Percentile: ${p95.toFixed(2)}ms`);
    console.log(`99th Percentile: ${p99.toFixed(2)}ms`);
    
    console.log('\n📈 STATUS CODE DISTRIBUTION');
    console.log('─'.repeat(30));
    Object.entries(statusCodes).forEach(([code, count]) => {
      const percentage = (count / requests.length * 100).toFixed(2);
      console.log(`${code}: ${count} (${percentage}%)`);
    });
    
    if (errors.length > 0) {
      console.log('\n❌ ERROR SUMMARY');
      console.log('─'.repeat(30));
      const errorTypes = {};
      errors.forEach(e => {
        errorTypes[e.error] = (errorTypes[e.error] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([error, count]) => {
        console.log(`${error}: ${count}`);
      });
    }
    
    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('─'.repeat(30));
    
    if (errorRate > 5) {
      console.log('❌ HIGH ERROR RATE - System may be overloaded');
    } else if (errorRate > 1) {
      console.log('⚠️  MODERATE ERROR RATE - Monitor system health');
    } else {
      console.log('✅ LOW ERROR RATE - System handling load well');
    }
    
    if (p95 > 1000) {
      console.log('❌ HIGH RESPONSE TIMES - Performance optimization needed');
    } else if (p95 > 500) {
      console.log('⚠️  MODERATE RESPONSE TIMES - Consider optimization');
    } else {
      console.log('✅ GOOD RESPONSE TIMES - System performing well');
    }
    
    if (throughput < 10) {
      console.log('❌ LOW THROUGHPUT - Scaling may be needed');
    } else if (throughput < 50) {
      console.log('⚠️  MODERATE THROUGHPUT - Monitor capacity');
    } else {
      console.log('✅ GOOD THROUGHPUT - System handling concurrent load');
    }

    // Save detailed results
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRequests: requests.length,
        successfulRequests: successfulRequests.length,
        failedRequests: failedRequests.length,
        errorRate,
        testDuration,
        throughput,
        avgDuration,
        minDuration,
        maxDuration,
        p50,
        p95,
        p99,
      },
      statusCodes,
      errors: errorTypes || {},
      requests: requests.slice(0, 1000), // Limit to first 1000 for file size
    };

    require('fs').writeFileSync('load-test-results.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed results saved to: load-test-results.json');
  }

  calculatePercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }
}

// Stress test scenarios
class StressTester extends LoadTester {
  async runStressTest() {
    console.log('\n🔥 STRESS TEST - Finding Breaking Point');
    console.log('═'.repeat(50));
    
    const scenarios = [
      { concurrent: 5, duration: 10000, name: 'Light Load' },
      { concurrent: 20, duration: 15000, name: 'Medium Load' },
      { concurrent: 50, duration: 20000, name: 'Heavy Load' },
      { concurrent: 100, duration: 25000, name: 'Extreme Load' },
    ];
    
    for (const scenario of scenarios) {
      console.log(`\n🧪 Testing ${scenario.name} (${scenario.concurrent} concurrent users)`);
      this.results = { requests: [], summary: {}, errors: [] };
      
      await this.runLoadTest({
        concurrent: scenario.concurrent,
        duration: scenario.duration,
        endpoints: ['/health', '/metrics'],
        rampUp: 2000,
      });
      
      // Brief pause between scenarios
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Spike test
class SpikeTester extends LoadTester {
  async runSpikeTest() {
    console.log('\n⚡ SPIKE TEST - Sudden Load Increase');
    console.log('═'.repeat(50));
    
    // Normal load for 10 seconds
    console.log('📊 Phase 1: Normal Load (10 users)');
    await this.runLoadTest({
      concurrent: 10,
      duration: 10000,
      endpoints: ['/health'],
      rampUp: 1000,
    });
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Sudden spike for 15 seconds
    console.log('\n⚡ Phase 2: Sudden Spike (100 users)');
    this.results = { requests: [], summary: {}, errors: [] };
    await this.runLoadTest({
      concurrent: 100,
      duration: 15000,
      endpoints: ['/health', '/metrics'],
      rampUp: 500, // Very fast ramp-up
    });
    
    // Brief pause
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return to normal
    console.log('\n📉 Phase 3: Return to Normal (10 users)');
    this.results = { requests: [], summary: {}, errors: [] };
    await this.runLoadTest({
      concurrent: 10,
      duration: 10000,
      endpoints: ['/health'],
      rampUp: 1000,
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'load';
  const baseUrl = args[1] || 'http://localhost:3000';
  
  try {
    switch (testType) {
      case 'load':
        const loadTester = new LoadTester(baseUrl);
        await loadTester.runLoadTest({
          concurrent: 20,
          duration: 30000,
          endpoints: ['/health', '/metrics'],
        });
        break;
        
      case 'stress':
        const stressTester = new StressTester(baseUrl);
        await stressTester.runStressTest();
        break;
        
      case 'spike':
        const spikeTester = new SpikeTester(baseUrl);
        await spikeTester.runSpikeTest();
        break;
        
      default:
        console.log('Usage: node load-test.js [load|stress|spike] [baseUrl]');
        console.log('Examples:');
        console.log('  node load-test.js load http://localhost:3000');
        console.log('  node load-test.js stress http://localhost:3000');
        console.log('  node load-test.js spike http://localhost:3000');
        process.exit(1);
    }
    
    console.log('\n✅ Load testing completed successfully');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Load testing failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { LoadTester, StressTester, SpikeTester };
