class Tip {
  final String tip;

  Tip({required this.tip});

  Map<String, dynamic> toFirestore() {
    return {
      'tip': tip,
    };
  }

  factory Tip.fromFirestore(Map<String, dynamic> data) {
    return Tip(
      tip: data['tip'],
    );
  }
}
