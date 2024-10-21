import 'dart:async';
import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:electricity_assistant/measurement_store.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

/// [ElectricityChart] displays real-time electricity usage measurements from Firestore.
class ElectricityChart extends StatefulWidget {
  const ElectricityChart({super.key});

  @override
  State<ElectricityChart> createState() => _ElectricityChartState();
}

class _ElectricityChartState extends State<ElectricityChart> {
  final List<FlSpot> _spots = [];
  final MeasurementStore _measurementStore = MeasurementStore();

  @override
  void initState() {
    super.initState();
    _measurementStore.streamMeasurements().listen(
      (measurements) {
        setState(() {
          _spots.clear();
          for (var measurement in measurements) {
            final x = measurement.date.millisecondsSinceEpoch.toDouble();
            final y = measurement.kwh.toDouble();
            _spots.add(FlSpot(x, y));
          }
        });
      },
      onError: (error) {
        print('Error fetching data from Firestore: $error');
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_spots.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return LineChart(
      LineChartData(
        backgroundColor: Colors.black12,
        lineTouchData: LineTouchData(
          touchTooltipData: LineTouchTooltipData(
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final date =
                    DateTime.fromMillisecondsSinceEpoch(spot.x.toInt());
                final formattedDate =
                    '${date.hour}:${date.minute}:${date.second}';
                return LineTooltipItem(
                  'Time: $formattedDate\nUsage: ${spot.y.toStringAsFixed(2)} kWh',
                  const TextStyle(color: Colors.white),
                );
              }).toList();
            },
          ),
        ),
        gridData: const FlGridData(show: true, drawVerticalLine: false),
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
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            axisNameWidget: const Text('Usage (kWh)',
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
            axisNameWidget: const Text('Time',
                style: TextStyle(fontWeight: FontWeight.bold)),
            sideTitles: SideTitles(
              showTitles: true,
              interval: _calculateTimeInterval(),
              getTitlesWidget: (value, meta) {
                final date = DateTime.fromMillisecondsSinceEpoch(value.toInt());
                final formattedTime =
                    '${date.hour}:${date.minute}:${date.second}';
                return SideTitleWidget(
                  axisSide: meta.axisSide,
                  child: Text(formattedTime,
                      style:
                          const TextStyle(color: Colors.black54, fontSize: 10)),
                );
              },
            ),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
        ),
      ),
    );
  }

  double _calculateTimeInterval() {
    if (_spots.length < 2) {
      return 1;
    }
    final start = _spots.first.x;
    final end = _spots.last.x;
    final interval = (end - start) / 5;
    return interval;
  }
}
