package com.minibudget.quicklog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class AmountParserTest {
  @Test fun acceptsWholeAndDecimal() {
    assertEquals(12.0, AmountParser.parse("12")!!, 0.0)
    assertEquals(12.5, AmountParser.parse("12.5")!!, 0.0)
    assertEquals(12.5, AmountParser.parse("  12.50 ")!!, 0.0)
  }

  @Test fun acceptsCurrencyPrefix() {
    assertEquals(12.5, AmountParser.parse("$12.50")!!, 0.0)
    assertEquals(12.5, AmountParser.parse("S$ 12.50")!!, 0.0)
    assertEquals(12.5, AmountParser.parse("sgd12.5")!!, 0.0)
  }

  @Test fun acceptsCommaDecimal() {
    assertEquals(12.5, AmountParser.parse("12,50")!!, 0.0)
    assertEquals(12.5, AmountParser.parse("12,5")!!, 0.0)
  }

  @Test fun acceptsThousandsSeparators() {
    assertEquals(1234.5, AmountParser.parse("1,234.50")!!, 0.0)
    assertEquals(1234.0, AmountParser.parse("1,234")!!, 0.0)
  }

  @Test fun rejectsEmptyAndBlank() {
    assertNull(AmountParser.parse(null))
    assertNull(AmountParser.parse(""))
    assertNull(AmountParser.parse("   "))
    assertNull(AmountParser.parse("$"))
  }

  @Test fun rejectsZeroAndNegative() {
    assertNull(AmountParser.parse("0"))
    assertNull(AmountParser.parse("0.00"))
    assertNull(AmountParser.parse("-5"))
    assertNull(AmountParser.parse("$-5"))
  }

  @Test fun rejectsNanInfinityAndGarbage() {
    assertNull(AmountParser.parse("NaN"))
    assertNull(AmountParser.parse("Infinity"))
    assertNull(AmountParser.parse("1e5"))
    assertNull(AmountParser.parse("abc"))
    assertNull(AmountParser.parse("12.345"))
    assertNull(AmountParser.parse("1.2.3"))
    assertNull(AmountParser.parse("12 50"))
  }
}
