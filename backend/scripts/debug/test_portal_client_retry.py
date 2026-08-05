"""
test_portal_client_retry.py — à lancer depuis backend/ : python test_portal_client_retry.py

Vérifie le comportement de _request_with_retry sans dépendre d'une vraie coupure
réseau (impossible à provoquer à volonté contre le vrai portail) : on simule les
exceptions directement sur session.get/post via un mock.

Ne nécessite pas pytest — unittest + unittest.mock suffisent (déjà dans la stdlib).
"""
import sys
sys.path.insert(0, ".")

import time
import unittest
from unittest.mock import MagicMock, patch

import requests

from app.services.acquisition.portal_client import PortalClient


class TestPortalClientRetry(unittest.TestCase):

    def setUp(self):
        self.client = PortalClient()
        self.client.session = MagicMock()  # on remplace la vraie session par un mock

    def _make_fake_response(self, status_code=200):
        resp = MagicMock()
        resp.status_code = status_code
        return resp

    @patch("time.sleep", return_value=None)  # on n'attend pas réellement pendant le test
    def test_connection_error_puis_succes(self, mock_sleep):
        """2 ConnectionError puis un succès -> doit réussir à la 3e tentative."""
        fake_ok = self._make_fake_response()
        self.client.session.get.side_effect = [
            requests.exceptions.ConnectionError("coupure 1"),
            requests.exceptions.ConnectionError("coupure 2"),
            fake_ok,
        ]
        result = self.client.get("https://example.test/page")
        self.assertIs(result, fake_ok)
        self.assertEqual(self.client.session.get.call_count, 3)

    @patch("time.sleep", return_value=None)
    def test_timeout_puis_succes(self, mock_sleep):
        """Idem avec Timeout — confirme que ce cas (ajouté après le bug initial) fonctionne."""
        fake_ok = self._make_fake_response()
        self.client.session.get.side_effect = [
            requests.exceptions.Timeout("lecture trop lente"),
            fake_ok,
        ]
        result = self.client.get("https://example.test/page")
        self.assertIs(result, fake_ok)
        self.assertEqual(self.client.session.get.call_count, 2)

    @patch("time.sleep", return_value=None)
    def test_chunked_encoding_error_puis_succes(self, mock_sleep):
        """Le cas du zip DCE tronqué en plein transfert (IncompleteRead / ChunkedEncodingError)."""
        fake_ok = self._make_fake_response()
        self.client.session.get.side_effect = [
            requests.exceptions.ChunkedEncodingError("IncompleteRead(6108792 bytes read, 19575412 more expected)"),
            fake_ok,
        ]
        result = self.client.get("https://example.test/dce.zip")
        self.assertIs(result, fake_ok)
        self.assertEqual(self.client.session.get.call_count, 2)

    @patch("time.sleep", return_value=None)
    def test_echec_apres_max_retries_relance_exception(self, mock_sleep):
        """Si TOUTES les tentatives échouent, l'exception doit remonter (pas de résultat silencieux)."""
        self.client.session.get.side_effect = requests.exceptions.ChunkedEncodingError("toujours coupé")

        with self.assertRaises(requests.exceptions.ChunkedEncodingError):
            self.client.get("https://example.test/dce.zip")

        self.assertEqual(self.client.session.get.call_count, 3)  # max_retries=3, aucune tentative de plus

    @patch("time.sleep", return_value=None)
    def test_backoff_progressif(self, mock_sleep):
        """Vérifie que le backoff est bien 1.5s, 3.0s entre les tentatives (linéaire, pas exponentiel —
        confirme ce qu'on avait diagnostiqué : pas de vraie exponentielle actuellement)."""
        self.client.session.get.side_effect = [
            requests.exceptions.ConnectionError("1"),
            requests.exceptions.ConnectionError("2"),
            self._make_fake_response(),
        ]
        self.client.get("https://example.test/page")

        appels_sleep = [call.args[0] for call in mock_sleep.call_args_list]
        self.assertEqual(appels_sleep, [1.5, 3.0])

    @patch("time.sleep", return_value=None)
    def test_post_beneficie_aussi_du_retry(self, mock_sleep):
        """Le formulaire d'identité (étape B du téléchargement DCE) passe par post() -> même filet."""
        fake_ok = self._make_fake_response()
        self.client.session.post.side_effect = [
            requests.exceptions.ConnectionError("coupure"),
            fake_ok,
        ]
        result = self.client.post("https://example.test/form", data={"nom": "a"})
        self.assertIs(result, fake_ok)
        self.assertEqual(self.client.session.post.call_count, 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
