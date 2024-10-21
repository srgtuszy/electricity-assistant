import 'dart:async';
import 'dart:math';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

/// [ElectricityChart] displays real-time electricity usage measurements.
class ElectricityChart extends StatefulWidget {
  const ElectricityChart({super.key});

  @override
  _ElectricityChartState createState() => _ElectricityChartState();
}

class _ElectricityChartState extends State<ElectricityChart> {
  final List<FlSpot> _spots = [];
  StreamSubscription<double>? _subscription;
  final int _maxSpots = 20;

  @override
  void initState() {
    super.initState();
    // Start the stream of random measurements.
    _subscription = _randomMeasurementStream().listen((measurement) {
      setState(() {
        // Update the spots list with the new measurement.
        final x = _spots.isNotEmpty ? _spots.last.x + 1 : 0;
        _spots.add(FlSpot(x.toDouble(), measurement));

        // Keep only the last [_maxSpots] measurements.
        if (_spots.length > _maxSpots) {
          _spots.removeAt(0);
        }
      });
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  /// Simulates a stream of random electricity usage measurements.
  Stream<double> _randomMeasurementStream() async* {
    final random = Random();
    while (true) {
      await Future.delayed(const Duration(seconds: 1));
      // Simulate measurements between 50 and 200 kilowatts.
      yield 50 + random.nextDouble() * 150;
    }
  }

  @override
  Widget build(BuildContext context) {
    return LineChart(
      LineChartData(
        backgroundColor: Colors.black12,
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                return LineTooltipItem(
                  'Time: ${spot.x.toInt()}s\nUsage: ${spot.y.toStringAsFixed(2)} kW',
                  const TextStyle(color: Colors.white),
                );
              }).toList();
            },
          ),
        ),
        gridData: FlGridData(show: true, drawVerticalLine: false),
        lineBarsData: [
          LineChartBarData(
            spots: _spots,
            isCurved: true,
            color: Colors.blueAccent,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [
                  Colors.blueAccent.withOpacity(0.5),
                  Colors.blueAccent.withOpacity(0.0),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
        minY: 0,
        maxY: 220,
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameWidget: const Text('Usage (kW)',
                style: TextStyle(fontWeight: FontWeight.bold)),
            sideTitles: SideTitles(
              showTitles: true,
              interval: 50,
              reservedSize: 50,
              getTitlesWidget: (value, meta) {
                return Text('${value.toInt()}',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 12));
              },
            ),
          ),
          bottomTitles: AxisTitles(
            axisNameWidget: const Text('Time (s)',
                style: TextStyle(fontWeight: FontWeight.bold)),
            sideTitles: SideTitles(
              showTitles: true,
              interval: 5,
              getTitlesWidget: (value, meta) {
                return Text('${value.toInt()}',
                    style:
                        const TextStyle(color: Colors.black54, fontSize: 12));
              },
            ),
          ),
          rightTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          topTitles: AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
      ),
    );
  }
}
